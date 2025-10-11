// LesfacilitateursBot.js
export function initBot(containerId, supabaseConfig, options = {}) {
  const container = document.getElementById(containerId)
  const { url, key } = supabaseConfig
  const { userId = 'user-'+crypto.randomUUID().slice(0,8), language = 'fr-FR' } = options

  // --- Création client Supabase ---
  import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm').then(({ createClient }) => {
    window.supabaseBot = createClient(url, key)
  })

  // --- Création interface bot ---
  const botButton = document.createElement('div')
  botButton.id = 'botButton'
  botButton.style = `
    position:fixed;bottom:20px;right:20px;width:60px;height:60px;
    border-radius:50%;background:#ffcc33;display:flex;justify-content:center;align-items:center;
    cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,0.3);z-index:999;
  `
  botButton.innerHTML = `<span style="font-size:30px;">👤</span>` // tête africaine stylisée
  container.appendChild(botButton)

  const botWindow = document.createElement('div')
  botWindow.id = 'botWindow'
  botWindow.style = `
    position:fixed;bottom:90px;right:20px;width:320px;height:400px;
    background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);
    display:none;flex-direction:column;overflow:hidden;z-index:999;
  `
  botWindow.innerHTML = `
    <div id="botHeader" style="background:#ffcc33;padding:8px;text-align:center;font-weight:bold;">
      Facilitateurs Bot
      <span id="botClose" style="float:right;cursor:pointer;">❌</span>
    </div>
    <div id="botContent" style="flex:1;padding:8px;overflow-y:auto;"></div>
    <div style="display:flex;">
      <input id="botInput" type="text" placeholder="Écrire..." style="flex:1;padding:6px;border:none;border-top:1px solid #ccc;">
      <button id="botSend" style="padding:6px;background:#ffcc33;border:none;cursor:pointer;">➡️</button>
    </div>
  `
  container.appendChild(botWindow)

  // --- Ouvrir / fermer ---
  botButton.onclick = () => botWindow.style.display = 'flex'
  document.getElementById('botClose').onclick = () => botWindow.style.display = 'none'

  const botContent = document.getElementById('botContent')
  const botInput = document.getElementById('botInput')
  const botSend = document.getElementById('botSend')

  // --- Messages ---
  function appendMessage(sender, text) {
    const msg = document.createElement('div')
    msg.style = `margin-bottom:6px;`
    msg.innerHTML = `<b>${sender}:</b> ${text}`
    botContent.appendChild(msg)
    botContent.scrollTop = botContent.scrollHeight
  }

  // --- Admin Code ---
  let adminMode = false
  const ADMIN_CODE = 'xy233233'

  async function handleBotMessage(text) {
    appendMessage('Vous', text)

    // Vérification code admin
    if(text.trim() === ADMIN_CODE) {
      adminMode = true
      showAdminPanel()
      return
    }

    if(adminMode) {
      appendMessage('Bot', '🔐 Mode admin actif. Utilisez les commandes pour gérer les utilisateurs.')
      return
    }

    // Conversation normale du bot
    appendMessage('Bot', `Salut ! Je suis là pour vous aider. Que cherchez-vous aujourd'hui ?`)
    // Ici tu peux ajouter la logique pour enregistrer les besoins dans Supabase
    if(window.supabaseBot) {
      try {
        await window.supabaseBot.from('bot_conversations').insert([{
          id: crypto.randomUUID(),
          user_id: userId,
          message: text,
          created_at: new Date()
        }])
      } catch(e){ console.error(e) }
    }
  }

  botSend.onclick = () => {
    const msg = botInput.value.trim()
    if(!msg) return
    botInput.value = ''
    handleBotMessage(msg)
  }

  botInput.addEventListener('keypress', e => {
    if(e.key === 'Enter') botSend.click()
  })

  // --- Admin panel ---
  async function showAdminPanel() {
    botContent.innerHTML = `<b>Tableau Admin</b><br><i>Liste des utilisateurs :</i><div id="adminUsers"></div>`
    const usersDiv = document.getElementById('adminUsers')
    if(!window.supabaseBot) return

    const { data: users, error } = await window.supabaseBot.from('users').select('*')
    if(error){ usersDiv.innerHTML = 'Erreur chargement utilisateurs'; console.error(error); return }

    users.forEach(u => {
      const div = document.createElement('div')
      div.style = 'margin-bottom:4px; display:flex; justify-content:space-between; padding:4px; border-bottom:1px solid #ccc;'
      div.innerHTML = `
        <span>${u.id} - ${u.name || 'Non défini'}</span>
        <span>
          <button onclick="toggleUser('${u.id}', true)">Débloquer</button>
          <button onclick="toggleUser('${u.id}', false)">Bloquer</button>
        </span>
      `
      usersDiv.appendChild(div)
    })
  }

  window.toggleUser = async (id, unblock) => {
    if(!window.supabaseBot) return
    await window.supabaseBot.from('users').update({blocked: !unblock}).eq('id', id)
    appendMessage('Bot', `Utilisateur ${id} ${unblock?'débloqué':'bloqué'}.`)
    showAdminPanel()
  }

  // --- Nettoyage automatique des conversations 30 derniers jours ---
  async function cleanOldConversations() {
    if(!window.supabaseBot) return
    const cutoff = new Date(Date.now() - 30*24*60*60*1000)
    const { data, error } = await window.supabaseBot.from('bot_conversations').select('id, created_at')
    if(data) {
      for(const c of data){
        if(new Date(c.created_at) < cutoff){
          await window.supabaseBot.from('bot_conversations').delete().eq('id', c.id)
        }
      }
    }
  }
  cleanOldConversations()
  setInterval(cleanOldConversations, 12*60*60*1000) // toutes les 12h

  return { handleBotMessage }
}