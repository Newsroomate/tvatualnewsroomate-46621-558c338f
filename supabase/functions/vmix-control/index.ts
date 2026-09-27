import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VmixCommand {
  action: 'set_text' | 'set_image' | 'overlay_on' | 'overlay_off' | 'send_to_air' | 'remove_from_air' | 'test_connection'
  vmix_host?: string
  vmix_port?: number
  input_name?: string
  field_name?: string
  value?: string
  overlay_number?: number
  message_id?: string
  message_data?: {
    sender_name: string
    message_text: string
    profile_photo_url?: string
  }
  field_names?: {
    name: string
    message: string
    photo: string
  }
}

async function sendVmixCommand(host: string, port: number, command: string): Promise<boolean> {
  try {
    const url = `http://${host}:${port}/api/?${command}`
    console.log('Sending vMix command:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      }
    })
    
    console.log('vMix response status:', response.status)
    return response.ok
  } catch (error) {
    console.error('vMix command error:', error)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Verify JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  })

  const token = authHeader.replace('Bearer ', '')
  const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token)
  
  if (claimsError || !claimsData?.user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { 
      status: 401, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const command: VmixCommand = await req.json()
    console.log('Received command:', command)

    const vmixHost = command.vmix_host || '192.168.0.2'
    const vmixPort = command.vmix_port || 8088
    const inputName = command.input_name || 'TarjaZAP'
    const overlayNumber = command.overlay_number || 1

    let success = false
    let message = ''

    switch (command.action) {
      case 'test_connection': {
        // Try to get vMix state
        try {
          const response = await fetch(`http://${vmixHost}:${vmixPort}/api/`, {
            method: 'GET'
          })
          success = response.ok
          message = success ? 'Conexão com vMix estabelecida' : 'Falha na conexão'
        } catch {
          success = false
          message = 'Não foi possível conectar ao vMix'
        }
        break
      }

      case 'set_text': {
        const fieldName = encodeURIComponent(command.field_name || '')
        const value = encodeURIComponent(command.value || '')
        success = await sendVmixCommand(
          vmixHost, 
          vmixPort, 
          `Function=SetText&Input=${encodeURIComponent(inputName)}&SelectedName=${fieldName}&Value=${value}`
        )
        message = success ? 'Texto atualizado' : 'Falha ao atualizar texto'
        break
      }

      case 'set_image': {
        const fieldName = encodeURIComponent(command.field_name || '')
        const value = encodeURIComponent(command.value || '')
        success = await sendVmixCommand(
          vmixHost, 
          vmixPort, 
          `Function=SetImage&Input=${encodeURIComponent(inputName)}&SelectedName=${fieldName}&Value=${value}`
        )
        message = success ? 'Imagem atualizada' : 'Falha ao atualizar imagem'
        break
      }

      case 'overlay_on': {
        success = await sendVmixCommand(
          vmixHost, 
          vmixPort, 
          `Function=OverlayInput${overlayNumber}On&Input=${encodeURIComponent(inputName)}`
        )
        message = success ? 'Overlay ativado' : 'Falha ao ativar overlay'
        break
      }

      case 'overlay_off': {
        success = await sendVmixCommand(
          vmixHost, 
          vmixPort, 
          `Function=OverlayInput${overlayNumber}Off`
        )
        message = success ? 'Overlay desativado' : 'Falha ao desativar overlay'
        break
      }

      case 'send_to_air': {
        if (!command.message_data || !command.field_names) {
          return new Response(JSON.stringify({ 
            success: false, 
            message: 'message_data e field_names são obrigatórios' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { sender_name, message_text, profile_photo_url } = command.message_data
        const { name: nameField, message: messageField, photo: photoField } = command.field_names

        // Set name
        const nameSuccess = await sendVmixCommand(
          vmixHost, vmixPort,
          `Function=SetText&Input=${encodeURIComponent(inputName)}&SelectedName=${encodeURIComponent(nameField)}&Value=${encodeURIComponent(sender_name)}`
        )

        // Set message
        const messageSuccess = await sendVmixCommand(
          vmixHost, vmixPort,
          `Function=SetText&Input=${encodeURIComponent(inputName)}&SelectedName=${encodeURIComponent(messageField)}&Value=${encodeURIComponent(message_text)}`
        )

        // Set photo if available
        let photoSuccess = true
        if (profile_photo_url) {
          photoSuccess = await sendVmixCommand(
            vmixHost, vmixPort,
            `Function=SetImage&Input=${encodeURIComponent(inputName)}&SelectedName=${encodeURIComponent(photoField)}&Value=${encodeURIComponent(profile_photo_url)}`
          )
        }

        // Show overlay
        const overlaySuccess = await sendVmixCommand(
          vmixHost, vmixPort,
          `Function=OverlayInput${overlayNumber}On&Input=${encodeURIComponent(inputName)}`
        )

        success = nameSuccess && messageSuccess && overlaySuccess
        message = success ? 'Mensagem enviada ao ar' : 'Falha parcial ao enviar mensagem'

        // Update message status in database if message_id provided
        if (command.message_id && success) {
          const serviceClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )
          
          await serviceClient
            .from('viewer_messages')
            .update({ 
              status: 'on_air',
              sent_to_vmix_at: new Date().toISOString()
            })
            .eq('id', command.message_id)
        }
        break
      }

      case 'remove_from_air': {
        success = await sendVmixCommand(
          vmixHost, vmixPort,
          `Function=OverlayInput${overlayNumber}Off`
        )
        message = success ? 'Removido do ar' : 'Falha ao remover do ar'

        // Update message status if message_id provided
        if (command.message_id && success) {
          const serviceClient = createClient(
            supabaseUrl,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
          )
          
          await serviceClient
            .from('viewer_messages')
            .update({ status: 'used' })
            .eq('id', command.message_id)
        }
        break
      }

      case 'get_state': {
        const startedAt = Date.now()
        try {
          const response = await fetch(`http://${vmixHost}:${vmixPort}/api/`, { method: 'GET' })
          const latency = Date.now() - startedAt
          if (!response.ok) {
            return new Response(JSON.stringify({ reachable: false, message: 'vMix respondeu com erro', latency_ms: latency }), {
              status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
          }
          const xml = await response.text()
          const version = xml.match(/<version>([^<]*)<\/version>/i)?.[1] ?? null
          const edition = xml.match(/<edition>([^<]*)<\/edition>/i)?.[1] ?? null
          const activeNumber = xml.match(/<active>(\d+)<\/active>/i)?.[1]
          const previewNumber = xml.match(/<preview>(\d+)<\/preview>/i)?.[1]
          const inputs: { number: number; title: string; key?: string; type?: string }[] = []
          const inputRegex = /<input\s+([^>]*)>([\s\S]*?)<\/input>|<input\s+([^>]*)\/>/gi
          let m: RegExpExecArray | null
          while ((m = inputRegex.exec(xml)) !== null) {
            const attrs = m[1] || m[3] || ''
            const num = Number(attrs.match(/number="(\d+)"/i)?.[1] ?? '0')
            const title = attrs.match(/title="([^"]*)"/i)?.[1] ?? ''
            const key = attrs.match(/key="([^"]*)"/i)?.[1]
            const type = attrs.match(/type="([^"]*)"/i)?.[1]
            if (num) inputs.push({ number: num, title, key, type })
          }
          const overlays: number[] = []
          const overlayRegex = /<overlay\s+number="(\d+)"/gi
          let o: RegExpExecArray | null
          while ((o = overlayRegex.exec(xml)) !== null) overlays.push(Number(o[1]))
          const playlists = inputs.filter((i) => (i.type || '').toLowerCase() === 'videolist').map((i) => i.title)
          const activeTitle = inputs.find((i) => i.number === Number(activeNumber))?.title ?? null
          const previewTitle = inputs.find((i) => i.number === Number(previewNumber))?.title ?? null
          return new Response(JSON.stringify({
            reachable: true,
            message: 'Conectado ao vMix',
            latency_ms: latency,
            version, edition,
            active_title: activeTitle,
            active_number: activeNumber ? Number(activeNumber) : null,
            preview_title: previewTitle,
            preview_number: previewNumber ? Number(previewNumber) : null,
            inputs, playlists, overlays,
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        } catch (e) {
          return new Response(JSON.stringify({
            reachable: false,
            message: 'Não foi possível conectar ao vMix',
            latency_ms: Date.now() - startedAt,
            error: e instanceof Error ? e.message : String(e),
          }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      case 'trigger_link': {
        const target = command.value || ''
        const linkType = command.link_type || 'input'
        let query = ''
        if (linkType === 'playlist') {
          query = `Function=SelectPlayList&Value=${encodeURIComponent(target)}`
        } else if (linkType === 'preset') {
          query = `Function=Preset&Value=${encodeURIComponent(target)}`
        } else {
          query = `Function=Cut&Input=${encodeURIComponent(target)}`
        }
        success = await sendVmixCommand(vmixHost, vmixPort, query)
        message = success ? 'Comando enviado ao vMix' : 'Falha ao acionar o vMix'
        break
      }

      default:
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'Ação desconhecida' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ success, message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ 
      success: false, 
      message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
