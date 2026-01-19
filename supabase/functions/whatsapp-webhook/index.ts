import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const whatsappVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!
  const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // GET request - Webhook verification from Meta
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification request:', { mode, token, challenge })

      if (mode === 'subscribe' && token === whatsappVerifyToken) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Webhook verification failed')
        return new Response('Forbidden', { status: 403, headers: corsHeaders })
      }
    }

    // POST request - Incoming messages
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('Received webhook:', JSON.stringify(body, null, 2))

      // Process WhatsApp messages
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value
              const messages = value.messages || []
              const contacts = value.contacts || []

              for (const message of messages) {
                // Only process text messages
                if (message.type !== 'text') {
                  console.log('Skipping non-text message:', message.type)
                  continue
                }

                const phoneNumber = message.from
                const messageText = message.text?.body || ''
                const messageId = message.id
                const timestamp = new Date(parseInt(message.timestamp) * 1000)

                // Find contact info
                const contact = contacts.find((c: any) => c.wa_id === phoneNumber)
                const senderName = contact?.profile?.name || phoneNumber

                console.log('Processing message:', {
                  from: phoneNumber,
                  name: senderName,
                  text: messageText
                })

                // Try to get profile photo
                let profilePhotoUrl: string | null = null
                try {
                  // Get profile photo URL from WhatsApp
                  const profileResponse = await fetch(
                    `https://graph.facebook.com/v18.0/${phoneNumber}/profile_picture`,
                    {
                      headers: {
                        'Authorization': `Bearer ${whatsappAccessToken}`
                      }
                    }
                  )

                  if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    if (profileData.url) {
                      // Download the image
                      const imageResponse = await fetch(profileData.url)
                      if (imageResponse.ok) {
                        const imageBlob = await imageResponse.blob()
                        const fileName = `profiles/${phoneNumber}_${Date.now()}.jpg`

                        // Upload to Supabase Storage
                        const { data: uploadData, error: uploadError } = await supabase
                          .storage
                          .from('viewer-media')
                          .upload(fileName, imageBlob, {
                            contentType: 'image/jpeg',
                            upsert: true
                          })

                        if (!uploadError && uploadData) {
                          const { data: publicUrl } = supabase
                            .storage
                            .from('viewer-media')
                            .getPublicUrl(fileName)
                          
                          profilePhotoUrl = publicUrl.publicUrl
                          console.log('Profile photo uploaded:', profilePhotoUrl)
                        }
                      }
                    }
                  }
                } catch (photoError) {
                  console.log('Could not fetch profile photo:', photoError)
                }

                // Insert message into database
                const { data, error } = await supabase
                  .from('viewer_messages')
                  .insert({
                    phone_number: phoneNumber,
                    sender_name: senderName,
                    message_text: messageText,
                    profile_photo_url: profilePhotoUrl,
                    message_type: 'text',
                    status: 'pending',
                    received_at: timestamp.toISOString()
                  })
                  .select()
                  .single()

                if (error) {
                  console.error('Error inserting message:', error)
                } else {
                  console.log('Message saved:', data.id)
                }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  } catch (error: unknown) {
    console.error('Webhook error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
