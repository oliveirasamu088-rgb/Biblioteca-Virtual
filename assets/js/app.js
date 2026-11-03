/* =====================================================================
   app.js — parte comum a todas as páginas (era config.php + header.php + footer.php)
     • h()            escapa HTML (proteção contra XSS)
     • sessão         login/papel (sessionStorage) e "porteiro" de páginas
     • flash          mensagens de uma tela para a próxima
     • Layout.montar  desenha topo, conteúdo e rodapé
     • cards          card de livro e de autor
   ===================================================================== */
(function () {
  var SITUACOES = ['Disponível', 'Emprestado', 'Reservado', 'Indisponível'];
  var PAPEIS = { leitor: 'Usuário', autor: 'Autor' };

  /** Escapa saída HTML. */
  function h(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c];
    });
  }

  // ---------- armazenamento da sessão (some ao fechar a aba, como a sessão do PHP) ----------
  var memoria = {};
  function sget(k) { try { return sessionStorage.getItem(k); } catch (e) { return memoria[k] || null; } }
  function sset(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { memoria[k] = v; } }
  function sdel(k) { try { sessionStorage.removeItem(k); } catch (e) { delete memoria[k]; } }

  function flash(tipo, msg) { sset('flash', JSON.stringify({ tipo: tipo, msg: msg })); }
  function pegarFlash() {
    var f = null;
    try { f = JSON.parse(sget('flash')); } catch (e) {}
    sdel('flash');
    return f;
  }

  function redirecionar(url) { location.href = url; }

  function usuarioId() { return parseInt(sget('usuario_id'), 10) || 0; }
  function usuarioLogado() { return usuarioId() > 0; }
  function papelAtual() { return sget('papel') || ''; }

  function entrarComo(id, email, papel) {
    sset('usuario_id', String(id));
    sset('usuario_email', email);
    sset('papel', papel);
    redirecionar(papel === 'autor' ? 'painel.html' : 'catalogo.html');
  }
  function sair() {
    ['usuario_id', 'usuario_email', 'papel'].forEach(sdel);
    redirecionar('login.html');
  }

  /** Abas Usuário | Autor das telas de entrada e cadastro. */
  function abasPapel(pagina, papel) {
    var html = '<div class="abas">';
    Object.keys(PAPEIS).forEach(function (chave) {
      html += '<a class="btn' + (chave === papel ? '' : ' btn-sec') + '" href="' + pagina + '?papel=' + chave + '">' + PAPEIS[chave] + '</a>';
    });
    return html + '</div>';
  }

  // ---------- Porteiro: roda em toda página e barra quem não pode entrar ----------
  var PUBLICAS = ['login.html', 'cadastro.html'];
  var SO_AUTOR = ['painel.html', 'autores.html', 'autor_form.html', 'livros.html', 'livro_form.html'];
  var SO_LEITOR = ['favoritos.html'];

  function paginaAtual() {
    var p = location.pathname.split('/').pop();
    return p === '' ? 'painel.html' : p;
  }

  /** Devolve true se a página pode abrir; senão redireciona e devolve false. */
  function porteiro() {
    var pag = paginaAtual();
    if (!usuarioLogado()) {
      if (PUBLICAS.indexOf(pag) < 0) { redirecionar('login.html'); return false; }
      return true;
    }
    var ehAutor = papelAtual() === 'autor';
    if (PUBLICAS.indexOf(pag) >= 0
      || (ehAutor && SO_LEITOR.indexOf(pag) >= 0)
      || (!ehAutor && SO_AUTOR.indexOf(pag) >= 0)) {
      redirecionar(ehAutor ? 'painel.html' : 'catalogo.html');
      return false;
    }
    return true;
  }

  /** Roda a função da página só se o porteiro deixar. */
  function iniciar(fn) {
    if (porteiro()) { fn(); }
  }

  // ---------- parâmetros da URL (era $_GET) ----------
  function param(nome) { return new URLSearchParams(location.search).get(nome); }
  function paramInt(nome) { var v = parseInt(param(nome), 10); return v > 0 ? v : 0; }

  // ---------- Layout (header.php + footer.php) ----------
  var Layout = {
    /** Desenha a página: topo, mensagem flash, conteúdo e rodapé. */
    montar: function (titulo, conteudo, opcoes) {
      var pagina = paginaAtual();
      var f = pegarFlash();
      var ativo = function (cond) { return cond ? 'ativo' : ''; };
      var nav = '';
      if (papelAtual() === 'autor') {
        nav = '<a href="painel.html" class="' + ativo(pagina === 'painel.html') + '">Painel</a>'
          + '<a href="autores.html" class="' + ativo(pagina.indexOf('autor') === 0) + '">Autores</a>'
          + '<a href="livros.html" class="' + ativo(pagina.indexOf('livro') === 0) + '">Livros</a>'
          + '<a href="catalogo.html" class="' + ativo(pagina === 'catalogo.html') + '">Catálogo</a>'
          + '<a href="estudos.html" class="' + ativo(pagina === 'estudos.html') + '">Estudos</a>';
      } else if (usuarioLogado()) {
        nav = '<a href="catalogo.html" class="' + ativo(pagina === 'catalogo.html') + '">Catálogo</a>'
          + '<a href="estudos.html" class="' + ativo(pagina === 'estudos.html') + '">Estudos</a>'
          + '<a href="autores_lista.html" class="' + ativo(pagina === 'autores_lista.html') + '">Autores</a>'
          + '<a href="favoritos.html" class="' + ativo(pagina === 'favoritos.html') + '"><span class="so-desktop">Livros favoritos</span><span class="so-mobile">Favoritos</span></a>';
      }
      var sairBtn = usuarioLogado() ? '<button class="btn btn-sec" type="button" id="btn-sair">Sair</button>' : '';

      document.title = titulo + ' · Biblioteca Comunitária';
      var alertaFlash = f ? '<div class="alerta alerta-' + h(f.tipo) + '" role="alert">' + h(f.msg) + '</div>' : '';
      document.getElementById('app').innerHTML = (opcoes && opcoes.semTopo)
        ? '<main class="login-main">' + alertaFlash + conteudo + '</main>'
        : '<header class="topo">'
        + '<a class="marca" href="painel.html">📚 Biblioteca</a>'
        + '<nav>' + nav + '</nav>'
        + '<div class="topo-acoes">' + sairBtn
        + '<button type="button" id="btn-tema" class="btn btn-sec" aria-label="Alternar tema">🌓</button></div>'
        + '</header>'
        + '<main class="container">'
        + (f ? '<div class="alerta alerta-' + h(f.tipo) + '" role="alert">' + h(f.msg) + '</div>' : '')
        + conteudo
        + '</main>'
        + '<footer class="rodape">Sistema de Gerenciamento de Biblioteca · WEB-TDS · IFB</footer>';

      document.getElementById('btn-tema').addEventListener('click', function () {
        var atual = document.documentElement.dataset.tema === 'escuro' ? 'claro' : 'escuro';
        document.documentElement.dataset.tema = atual;
        try { localStorage.setItem('tema', atual); } catch (e) {}
      });
      olhosSenha();
      var bs = document.getElementById('btn-sair');
      if (bs) { bs.addEventListener('click', sair); }
    },

    /** Lista de erros no formato do alerta vermelho. */
    erros: function (lista) {
      if (!lista || !lista.length) { return ''; }
      return '<div class="alerta alerta-erro" role="alert"><ul>'
        + lista.map(function (e) { return '<li>' + h(e) + '</li>'; }).join('') + '</ul></div>';
    }
  };

  // ---------- Ver/ocultar senha: botão de olho dentro de todo campo de senha ----------
  var OLHO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var OLHO_RISCADO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

  function olhosSenha() {
    document.querySelectorAll('input[type="password"]').forEach(function (campo) {
      if (campo.parentNode.classList.contains('senha-campo')) { return; }
      var caixa = document.createElement('span');
      caixa.className = 'senha-campo';
      campo.parentNode.insertBefore(caixa, campo);
      caixa.appendChild(campo);
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'senha-olho';
      b.setAttribute('aria-label', 'Mostrar senha'); b.setAttribute('aria-pressed', 'false');
      b.innerHTML = OLHO;
      b.addEventListener('click', function () {
        var mostrar = campo.type === 'password';
        campo.type = mostrar ? 'text' : 'password';
        b.innerHTML = mostrar ? OLHO_RISCADO : OLHO;
        b.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
        b.setAttribute('aria-pressed', mostrar ? 'true' : 'false');
        campo.focus();
      });
      caixa.appendChild(b);
    });
  }

  // Confirmação antes de excluir: qualquer <form data-confirmar="..."> pergunta antes de enviar
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.dataset && f.dataset.confirmar && !confirm(f.dataset.confirmar)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  // ---------- Favoritos (♡/♥) ----------
  function botaoFavorito(tipo, id, ativo) {
    if (papelAtual() === 'autor') { return ''; }   // favoritar é função do usuário
    return '<form class="fav" data-fav="' + h(tipo) + '" data-id="' + id + '">'
      + '<button type="submit" class="fav-btn' + (ativo ? ' ativo' : '') + '" aria-label="'
      + (ativo ? 'Remover dos favoritos' : 'Favoritar') + '">' + (ativo ? '♥' : '♡') + '</button></form>';
  }

  // Cada página pode definir App.aoFavoritar para redesenhar depois de favoritar
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f.dataset || !f.dataset.fav) { return; }
    e.preventDefault();
    var tipo = f.dataset.fav, id = parseInt(f.dataset.id, 10);
    var ativo = DB.alternarFavorito(tipo, usuarioId(), id);
    if (typeof App.aoFavoritar === 'function') { App.aoFavoritar(); return; }
    var b = f.querySelector('.fav-btn');
    b.classList.toggle('ativo', ativo);
    b.textContent = ativo ? '♥' : '♡';
    b.setAttribute('aria-label', ativo ? 'Remover dos favoritos' : 'Favoritar');
  });

  /** Card de livro (capa + título + autor + ♡). */
  function cardLivro(l) {
    var t = h(l.titulo), a = h(l.autor_nome || 'Autor desconhecido');
    var capa = l.capa
      ? '<img class="capa" src="' + h(srcImagem(l.capa)) + '" alt="Capa de ' + t + '" loading="lazy">'
      : '<span class="sem-capa">Capa não disponível</span>';
    return '<div class="card-livro">' + botaoFavorito('livro', l.id, !!l.fav)
      + '<a class="card-link" href="livro.html?id=' + l.id + '" title="' + t + '">' + capa
      + '<span class="texto"><span class="titulo">' + t + '</span><span class="autor">' + a + '</span></span></a></div>';
  }

  function dataBR(iso) {
    var p = String(iso).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }

  function cardAutor(a) {
    var nome = h(a.nome);
    var foto = a.capa
      ? '<img class="autor-foto" src="' + h(srcImagem(a.capa)) + '" alt="Foto de ' + nome + '" loading="lazy">'
      : '<span class="autor-foto autor-sem-foto" aria-hidden="true">' + h(String(a.nome).charAt(0).toUpperCase()) + '</span>';
    var topo = a.qtd > 0 ? '<a href="catalogo.html?autor=' + a.id + '">' + nome + '</a>' : nome;
    return '<article class="autor-card">' + botaoFavorito('autor', a.id, !!a.fav) + foto
      + '<div class="autor-info"><h3>' + topo + '</h3><p>' + h(a.nacionalidade) + ' · nasc. ' + h(dataBR(a.data_nascimento))
      + '</p><p>' + a.qtd + ' livro(s)</p></div></article>';
  }

  /** Capas novas ficam guardadas como "data:" no banco; as antigas são arquivos de uploads/. */
  function srcImagem(capa) {
    return String(capa).indexOf('data:') === 0 ? capa : 'assets/uploads/' + String(capa).split('/').pop();
  }

  // ---------- Capa/foto: valida (JPG/PNG/WEBP até 2 MB) e reduz para caber no navegador ----------
  /** Devolve uma Promise com { erro, dados }. dados = null se nenhum arquivo foi escolhido. */
  function lerCapa(input) {
    return new Promise(function (resolve) {
      var arq = input && input.files && input.files[0];
      if (!arq) { return resolve({ erro: null, dados: null }); }
      if (arq.size > 2 * 1024 * 1024) { return resolve({ erro: 'A capa deve ter no máximo 2 MB.', dados: null }); }
      if (['image/jpeg', 'image/png', 'image/webp'].indexOf(arq.type) < 0) {
        return resolve({ erro: 'Use uma imagem JPG, PNG ou WEBP.', dados: null });
      }
      var url = URL.createObjectURL(arq);
      var img = new Image();
      img.onload = function () {
        var max = 700, esc = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas');
        c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve({ erro: null, dados: c.toDataURL('image/jpeg', 0.85) });
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve({ erro: 'Use uma imagem JPG, PNG ou WEBP.', dados: null }); };
      img.src = url;
    });
  }

  // ---------- Senha: SHA-256 com sal (substitui password_hash do PHP) ----------
  function sha256(str) {
    var i, j, K = sha256.K;
    function rr(v, n) { return (v >>> n) | (v << (32 - n)); }
    if (!K) {   // constantes (raízes cúbicas dos 64 primeiros primos), calculadas uma vez
      K = sha256.K = [];
      var primos = 0, n = 2;
      while (primos < 64) {
        var ehPrimo = true;
        for (i = 2; i * i <= n; i++) { if (n % i === 0) { ehPrimo = false; break; } }
        if (ehPrimo) { K[primos++] = (Math.pow(n, 1 / 3) % 1) * 4294967296 | 0; }
        n++;
      }
    }
    var H = [1779033703, 3144134277, 1013904242, 2773480762, 1359893119, 2600822924, 528734635, 1541459225];
    var bytes = unescape(encodeURIComponent(str)), len = bytes.length, w = [];
    for (i = 0; i < len; i++) { w[i >> 2] |= bytes.charCodeAt(i) << (24 - (i % 4) * 8); }
    w[len >> 2] |= 0x80 << (24 - (len % 4) * 8);
    w[(((len + 8) >> 6) << 4) + 15] = len * 8;
    for (j = 0; j < w.length; j += 16) {
      var W = [], a = H.slice(0);
      for (i = 0; i < 64; i++) {
        if (i < 16) { W[i] = w[j + i] | 0; } else {
          var s0 = rr(W[i - 15], 7) ^ rr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
          var s1 = rr(W[i - 2], 17) ^ rr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
          W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
        }
        var S1 = rr(a[4], 6) ^ rr(a[4], 11) ^ rr(a[4], 25);
        var ch = (a[4] & a[5]) ^ (~a[4] & a[6]);
        var t1 = (a[7] + S1 + ch + K[i] + W[i]) | 0;
        var S0 = rr(a[0], 2) ^ rr(a[0], 13) ^ rr(a[0], 22);
        var mj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]);
        var t2 = (S0 + mj) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (i = 0; i < 8; i++) { H[i] = (H[i] + a[i]) | 0; }
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function gerarSal() {
    var b = new Uint8Array(8);
    (window.crypto || window.msCrypto).getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }
  function hashSenha(senha) {
    var sal = gerarSal(), r = sal + senha, i;
    for (i = 0; i < 2000; i++) { r = sha256(r + senha); }
    return sal + '$' + r;
  }
  function conferirSenha(senha, hash) {
    var p = String(hash).split('$'), r = p[0] + senha, i;
    for (i = 0; i < 2000; i++) { r = sha256(r + senha); }
    return r === p[1];
  }

  var App = {
    h: h, SITUACOES: SITUACOES, PAPEIS: PAPEIS,
    flash: flash, redirecionar: redirecionar,
    usuarioId: usuarioId, usuarioLogado: usuarioLogado, papelAtual: papelAtual,
    entrarComo: entrarComo, abasPapel: abasPapel, iniciar: iniciar,
    param: param, paramInt: paramInt, paginaAtual: paginaAtual,
    Layout: Layout, botaoFavorito: botaoFavorito, cardLivro: cardLivro, cardAutor: cardAutor,
    dataBR: dataBR, srcImagem: srcImagem, lerCapa: lerCapa,
    hashSenha: hashSenha, conferirSenha: conferirSenha,
    anoMax: function () { return new Date().getFullYear() + 1; },
    hoje: function () {
      var d = new Date();
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    },
    aoFavoritar: null
  };
  window.App = App;
})();
