const video = document.getElementById('video');
const channelsEl = document.getElementById('channels');
const note = document.getElementById('note');
let hls = null;

// Função para reproduzir stream
function playStream(url) {
    if (!url) return alert('URL inválida');

    if (hls) {
        try { hls.destroy(); } catch(e) {}
        hls = null;
    }

    if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(()=>{}));
        hls.on(Hls.Events.ERROR, (event, data) => console.warn('HLS error', data));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.addEventListener('loadedmetadata', ()=> video.play().catch(()=>{}), {once:true});
    } else {
        alert('HLS não suportado neste navegador');
    }
}

// Função para atualizar nota/aviso
function setNote(msg) {
    note.textContent = msg;
}

// Parse M3U para array de canais
function parseM3U(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    const list = [];
    for (let i=0; i<lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXTINF')) {
            const commaIdx = line.indexOf(',');
            const name = commaIdx > -1 ? line.substring(commaIdx+1).trim() : line;
            let j = i + 1;
            while (j < lines.length && lines[j].startsWith('#')) j++;
            if (j < lines.length && lines[j]) {
                list.push({name, url: lines[j]});
                i = j;
            }
        }
    }
    return list;
}

// Renderiza lista de canais
function renderChannels(list) {
    channelsEl.innerHTML = '';
    if (!list.length) {
        channelsEl.innerHTML = '<li>Nenhum canal encontrado</li>';
        return;
    }
    list.forEach(ch => {
        const li = document.createElement('li');
        const title = document.createElement('div');
        title.style.fontSize = '14px';
        title.style.marginBottom = '8px';
        title.textContent = ch.name;
        const btn = document.createElement('button');
        btn.className = 'playbtn';
        btn.textContent = '▶︎ Assistir';
        btn.addEventListener('click', () => playStream(ch.url));
        li.appendChild(title);
        li.appendChild(btn);
        channelsEl.appendChild(li);
    });
}

// ---------------- Eventos -----------------

// Carregar URL M3U
document.getElementById('loadM3UUrl').addEventListener('click', ()=>{
    const url = document.getElementById('m3uUrl').value.trim();
    if (!url) return alert('Cole a URL do M3U');

    setNote('Carregando playlist...');
    fetch(url).then(r => {
        if(!r.ok) throw new Error('Falha HTTP '+r.status);
        return r.text();
    }).then(text => {
        const list = parseM3U(text);
        renderChannels(list);
        setNote('Playlist carregada via URL.');
    }).catch(err => {
        console.error(err);
        alert('Erro ao carregar M3U: '+err.message);
    });
});

// Carregar arquivo M3U do dispositivo
document.getElementById('m3uFile').addEventListener('change', (e)=>{
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        const list = parseM3U(evt.target.result);
        renderChannels(list);
        setNote('Playlist carregada do arquivo.');
    };
    reader.readAsText(file);
});

// Botão de exemplo
document.getElementById('loadSample').addEventListener('click', ()=>{
    const sample = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
    playStream(sample);
    setNote('Reproduzindo stream de teste.');
});

// Limpar lista
document.getElementById('clearList').addEventListener('click', ()=>{
    channelsEl.innerHTML = '';
    setNote('Lista limpa.');
});
