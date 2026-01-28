import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to download media from WhatsApp
async function downloadWhatsAppMedia(
  mediaId: string, 
  accessToken: string
): Promise<{ blob: Blob; mimeType: string } | null> {
  try {
    // Step 1: Get media URL from WhatsApp
    const mediaInfoResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )

    if (!mediaInfoResponse.ok) {
      console.error('Failed to get media info:', await mediaInfoResponse.text())
      return null
    }

    const mediaInfo = await mediaInfoResponse.json()
    const mediaUrl = mediaInfo.url
    const mimeType = mediaInfo.mime_type || 'application/octet-stream'

    console.log('Media info:', { mediaId, mimeType, url: mediaUrl?.substring(0, 50) + '...' })

    // Step 2: Download the actual media file
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!mediaResponse.ok) {
      console.error('Failed to download media:', await mediaResponse.text())
      return null
    }

    const blob = await mediaResponse.blob()
    console.log('Media downloaded:', { size: blob.size, type: mimeType })

    return { blob, mimeType }
  } catch (error) {
    console.error('Error downloading media:', error)
    return null
  }
}

// Helper to get file extension from mime type
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'video/3gpp': '3gp',
    'audio/aac': 'aac',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'application/pdf': 'pdf',
  }
  return extensions[mimeType] || 'bin'
}

Deno.serve(async (req) => {
  const requestTime = new Date().toISOString()
  const requestMethod = req.method
  const requestUrl = req.url
  
  // Log EVERY request for debugging
  console.log(`[${requestTime}] ========== INCOMING REQUEST ==========`)
  console.log(`[${requestTime}] Method: ${requestMethod}`)
  console.log(`[${requestTime}] URL: ${requestUrl}`)
  console.log(`[${requestTime}] Headers:`, Object.fromEntries(req.headers.entries()))

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log(`[${requestTime}] Handling CORS preflight`)
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const whatsappVerifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')!
  const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')!

  console.log(`[${requestTime}] Secrets check - VERIFY_TOKEN exists: ${!!whatsappVerifyToken}, ACCESS_TOKEN exists: ${!!whatsappAccessToken}`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // GET request - Webhook verification OR test endpoint
    if (req.method === 'GET') {
      const url = new URL(req.url)
      
      // Test endpoint: /whatsapp-webhook?test=true
      if (url.searchParams.get('test') === 'true') {
        console.log(`[${requestTime}] TEST ENDPOINT CALLED - Simulating message insertion`)
        
        const { data, error } = await supabase
          .from('viewer_messages')
          .insert({
            phone_number: '5511999999999',
            sender_name: 'Teste Manual',
            message_text: `Mensagem de teste - ${requestTime}`,
            message_type: 'text',
            status: 'pending',
            received_at: requestTime
          })
          .select()
          .single()
        
        if (error) {
          console.error(`[${requestTime}] TEST FAILED - Error inserting:`, error)
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
        
        console.log(`[${requestTime}] TEST SUCCESS - Message inserted:`, data.id)
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Test message inserted successfully',
          data 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      // Normal webhook verification
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log(`[${requestTime}] Webhook verification request:`, { mode, token: token?.substring(0, 5) + '...', challenge: challenge?.substring(0, 10) + '...' })
      console.log(`[${requestTime}] Expected token starts with: ${whatsappVerifyToken?.substring(0, 5)}...`)

      if (mode === 'subscribe' && token === whatsappVerifyToken) {
        console.log(`[${requestTime}] ✓ Webhook verified successfully`)
        return new Response(challenge, { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        })
      } else {
        console.error(`[${requestTime}] ✗ Webhook verification FAILED - Token mismatch`)
        return new Response('Forbidden', { status: 403, headers: corsHeaders })
      }
    }

    // POST request - Incoming messages
    if (req.method === 'POST') {
      const rawBody = await req.text()
      console.log(`[${requestTime}] POST body (raw):`, rawBody.substring(0, 500))
      
      const body = JSON.parse(rawBody)
      console.log(`[${requestTime}] POST body (parsed):`, JSON.stringify(body, null, 2))

      // Process WhatsApp messages
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry || []) {
          for (const change of entry.changes || []) {
            if (change.field === 'messages') {
              const value = change.value
              const messages = value.messages || []
              const contacts = value.contacts || []

              for (const message of messages) {
                const messageType = message.type
                const phoneNumber = message.from
                const timestamp = new Date(parseInt(message.timestamp) * 1000)

                // Find contact info
                const contact = contacts.find((c: any) => c.wa_id === phoneNumber)
                const senderName = contact?.profile?.name || phoneNumber

                // Supported message types
                const supportedTypes = ['text', 'image', 'video', 'audio', 'document', 'sticker']
                if (!supportedTypes.includes(messageType)) {
                  console.log('Skipping unsupported message type:', messageType)
                  continue
                }

                console.log('Processing message:', {
                  type: messageType,
                  from: phoneNumber,
                  name: senderName
                })

                let messageText = ''
                let mediaUrl: string | null = null
                let profilePhotoUrl: string | null = null

                // Extract message text
                if (messageType === 'text') {
                  messageText = message.text?.body || ''
                } else if (message[messageType]?.caption) {
                  // Media with caption
                  messageText = message[messageType].caption
                }

                // Process media messages
                if (['image', 'video', 'audio', 'document', 'sticker'].includes(messageType)) {
                  const mediaData = message[messageType]
                  const mediaId = mediaData?.id

                  if (mediaId) {
                    console.log(`Downloading ${messageType}:`, mediaId)
                    
                    const downloadedMedia = await downloadWhatsAppMedia(mediaId, whatsappAccessToken)
                    
                    if (downloadedMedia) {
                      const { blob, mimeType } = downloadedMedia
                      const extension = getExtensionFromMimeType(mimeType)
                      const fileName = `media/${phoneNumber}_${Date.now()}.${extension}`

                      // Upload to Supabase Storage
                      const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('viewer-media')
                        .upload(fileName, blob, {
                          contentType: mimeType,
                          upsert: true
                        })

                      if (!uploadError && uploadData) {
                        const { data: publicUrl } = supabase
                          .storage
                          .from('viewer-media')
                          .getPublicUrl(fileName)
                        
                        mediaUrl = publicUrl.publicUrl
                        console.log('Media uploaded:', mediaUrl)
                      } else {
                        console.error('Error uploading media:', uploadError)
                      }
                    }
                  }
                }

                // Try to get profile photo
                try {
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
                      const imageResponse = await fetch(profileData.url)
                      if (imageResponse.ok) {
                        const imageBlob = await imageResponse.blob()
                        const fileName = `profiles/${phoneNumber}_${Date.now()}.jpg`

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
                    message_text: messageText || `[${messageType.toUpperCase()}]`,
                    message_type: messageType,
                    media_url: mediaUrl,
                    profile_photo_url: profilePhotoUrl,
                    status: 'pending',
                    received_at: timestamp.toISOString()
                  })
                  .select()
                  .single()

                if (error) {
                  console.error('Error inserting message:', error)
                } else {
                  console.log('Message saved:', data.id, { type: messageType, hasMedia: !!mediaUrl })
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
