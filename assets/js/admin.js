/* admin.js — área do Autor: painel.html, autores.html, autor_form.html, livros.html, livro_form.html
   (eram index.php, autores.php, autor_form.php, livros.php e livro_form.php) */
(function () {
  var h = App.h;

  function erroSalvar(err, padrao) {
    return err && err.code === 'QUOTA' ? 'Sem espaço no navegador para salvar a imagem. Use uma imagem menor.' : padrao;
  }

  // ------------------------------------------------------------ painel.html (Painel)
  function painel() {
    var livros = DB.livros(), autores = DB.autores(), cats = DB.categorias();
    var nCat = {};
    livros.forEach(function (l) { var c = DB.categoria(l.categoria_id); var n = c ? c.nome : 'Sem categoria'; nCat[n] = (nCat[n] || 0) + 1; });
    var catLista = Object.keys(nCat).sort(function (a, b) { return nCat[b] - nCat[a]; });
    var porAutor = {};
    livros.forEach(function (l) { porAutor[l.autor_id] = (porAutor[l.autor_id] || 0) + 1; });
    var top = Object.keys(porAutor).sort(function (a, b) { return porAutor[b] - porAutor[a]; }).slice(0, 5)
      .map(function (id) { return { a: DB.autor(parseInt(id, 10)), n: porAutor[id] }; }).filter(function (t) { return t.a; });
    var hr = new Date().getHours();
    var saud = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
    var ico = function (d) { return '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + d + '</svg>'; };
    var stat = function (href, icone, chave, num, rot) {
      return '<a class="pn-card pn-stat" href="' + href + '"><span class="pn-ic">' + icone + '</span><span><span class="pn-n" data-alvo="' + num + '">0</span><span class="pn-rot">' + rot + '</span></span><span class="pn-go" aria-hidden="true">→</span></a>';
    };

    App.Layout.montar('Início',
      '<div class="pn-hero"><div><h1>' + saud + '!</h1><p class="pn-sub">Veja como está o acervo hoje e comece por aqui.</p></div>'
      + '<div class="pn-busca"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
      + '<input id="pn-q" type="search" placeholder="Buscar livro ou autor..." autocomplete="off" aria-label="Buscar livro ou autor"><div class="pn-res" id="pn-res" hidden></div></div></div>'
      + '<div class="pn-stats">'
      + stat('autores.html', ico('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5-4-5.5"/>'), 'a', autores.length, 'Autores cadastrados')
      + stat('livros.html', ico('<path d="M4 4h6a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v15h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H4z"/><path d="M12 5v15"/>'), 'l', livros.length, 'Livros no acervo')
      + stat('catalogo.html', ico('<path d="M3 12l9-9 9 9-9 9z"/>'), 'c', catLista.length, 'Categorias em uso')
      + '</div>'
      + '<div class="acoes"><a class="btn" href="autor_form.html">+ Novo autor</a><a class="btn" href="livro_form.html">+ Novo livro</a><a class="btn btn-sec" href="catalogo.html">Ver catálogo</a></div>'
      + '<div class="pn-cols"><section class="pn-card"><h2>Livros por categoria <small class="pn-fil" id="pn-fil"></small></h2><div id="pn-bars"></div></section>'
      + '<section class="pn-card"><h2>Autores com mais livros</h2>'
      + (top.length ? top.map(function (t) {
          return '<a class="pn-top" href="autor_form.html?id=' + t.a.id + '"><span class="pn-av">' + h(t.a.nome.charAt(0).toUpperCase()) + '</span><span>' + h(t.a.nome) + '</span><span class="pn-rot">' + t.n + (t.n === 1 ? ' livro' : ' livros') + '</span></a>';
        }).join('') : '<p class="vazio">Cadastre livros para ver o ranking.</p>')
      + '</section></div>'
      + '<section class="pn-card pn-ult"><h2 id="pn-tit">Últimos livros</h2><div class="pn-trilho" id="pn-trilho"></div></section>');

    // números que sobem
    [].forEach.call(document.querySelectorAll('.pn-n'), function (el) {
      var alvo = parseInt(el.dataset.alvo, 10), t0 = performance.now();
      if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = alvo; return; }
      (function passo(t) {
        var p = Math.min(1, (t - t0) / 900);
        el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
        if (p < 1) { requestAnimationFrame(passo); }
      })(t0);
    });

    // gráfico por categoria (clique filtra os livros abaixo)
    var sel = null;
    function capaLivro(l) {
      return l.capa ? '<img src="' + h(App.srcImagem(l.capa)) + '" alt="Capa de ' + h(l.titulo) + '" loading="lazy">' : h(l.titulo);
    }
    function mostrarLivros() {
      var lista = livros.filter(function (l) {
        var c = DB.categoria(l.categoria_id); return !sel || (c ? c.nome : 'Sem categoria') === sel;
      }).slice().reverse().slice(0, sel ? 40 : 14);
      document.getElementById('pn-tit').textContent = sel ? 'Livros em ' + sel : 'Últimos livros';
      document.getElementById('pn-fil').innerHTML = sel ? 'filtrando <button type="button" id="pn-limpar">limpar ✕</button>' : 'clique para filtrar';
      document.getElementById('pn-trilho').innerHTML = lista.length ? lista.map(function (l) {
        var a = DB.autor(l.autor_id);
        return '<a class="pn-liv" href="livro.html?id=' + l.id + '"><span class="pn-cap">' + capaLivro(l) + '</span><b>' + h(l.titulo) + '</b><small>' + h(a ? a.nome : '') + '</small></a>';
      }).join('') : '<p class="vazio">Nenhum livro ainda.</p>';
    }
    function desenharBarras() {
      var mx = nCat[catLista[0]] || 1;
      document.getElementById('pn-bars').innerHTML = catLista.map(function (c) {
        return '<button type="button" class="pn-bar' + (sel === c ? ' on' : '') + '" data-c="' + h(c) + '"><span>' + h(c) + '</span><i><u data-w="' + (nCat[c] / mx * 100) + '"></u></i><b>' + nCat[c] + '</b></button>';
      }).join('');
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        [].forEach.call(document.querySelectorAll('.pn-bar u'), function (u) { u.style.width = u.dataset.w + '%'; });
      }); });
    }
    document.getElementById('pn-bars').addEventListener('click', function (e) {
      var b = e.target.closest('.pn-bar'); if (!b) { return; }
      sel = sel === b.dataset.c ? null : b.dataset.c; desenharBarras(); mostrarLivros();
    });
    document.getElementById('pn-fil').addEventListener('click', function (e) {
      if (e.target.id === 'pn-limpar') { sel = null; desenharBarras(); mostrarLivros(); }
    });
    desenharBarras(); mostrarLivros();

    // busca ao vivo
    var q = document.getElementById('pn-q'), res = document.getElementById('pn-res');
    q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase();
      if (!v) { res.hidden = true; return; }
      var ach = livros.filter(function (l) {
        var a = DB.autor(l.autor_id); return (l.titulo + ' ' + (a ? a.nome : '')).toLowerCase().indexOf(v) > -1;
      }).slice(0, 6);
      res.innerHTML = ach.length ? ach.map(function (l) {
        var a = DB.autor(l.autor_id);
        return '<a href="livro.html?id=' + l.id + '"><span>' + h(l.titulo) + '</span><small>' + h(a ? a.nome : '') + '</small></a>';
      }).join('') : '<p class="vazio">Nada encontrado.</p>';
      res.hidden = false;
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pn-busca')) { res.hidden = true; } });
  }

  // ------------------------------------------------------------ autores.html
  var POR_PAGINA = 10;
  var estAut = { q: '', nac: '', ord: 'nome', pag: 1 };

  function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }

  function autoresFiltrados(todos) {
    var q = semAcento(estAut.q.trim());
    var lista = todos.filter(function (a) {
      if (estAut.nac && a.nacionalidade !== estAut.nac) { return false; }
      return !q || semAcento(a.nome).indexOf(q) > -1 || semAcento(a.nacionalidade).indexOf(q) > -1;
    });
    var o = estAut.ord;
    lista.sort(function (a, b) {
      if (o === 'nasc') { return String(a.data_nascimento).localeCompare(String(b.data_nascimento)); }
      if (o === 'nasc-desc') { return String(b.data_nascimento).localeCompare(String(a.data_nascimento)); }
      if (o === 'livros') { return DB.qtdLivrosDoAutor(b.id) - DB.qtdLivrosDoAutor(a.id) || a.nome.localeCompare(b.nome, 'pt'); }
      if (o === 'nome-desc') { return b.nome.localeCompare(a.nome, 'pt'); }
      return a.nome.localeCompare(b.nome, 'pt');
    });
    return lista;
  }

  function seculo(iso) {
    var ano = parseInt(iso, 10); if (!ano) { return ''; }
    var n = Math.floor((ano - 1) / 100) + 1, r = '', m = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    m.forEach(function (p) { while (n >= p[0]) { r += p[1]; n -= p[0]; } });
    return 'séc. ' + r;
  }

  function botaoFoto(a) {
    var conteudo = a.capa
      ? '<img class="miniatura" src="' + h(App.srcImagem(a.capa)) + '" alt="">'
      : '<span class="miniatura miniatura-vazia" aria-hidden="true">' + h(a.nome.charAt(0).toUpperCase()) + '</span>';
    return '<button type="button" class="aut-foto" data-foto="' + a.id + '" aria-label="Ver foto de ' + h(a.nome) + '" title="Ver foto">' + conteudo + '</button>';
  }

  function desenharListaAutores() {
    var todos = DB.autores(), lista = autoresFiltrados(todos);
    var paginas = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (estAut.pag > paginas) { estAut.pag = paginas; }
    var ini = (estAut.pag - 1) * POR_PAGINA, linhas = lista.slice(ini, ini + POR_PAGINA);
    var el = document.getElementById('aut-lista');
    if (!linhas.length) {
      el.innerHTML = '<p class="vazio">' + (todos.length ? 'Nenhum autor encontrado. Ajuste a busca ou o filtro.' : 'Nenhum autor cadastrado ainda.') + '</p>';
      return;
    }
    var html = '<div class="tabela-wrap"><table class="tabela-autores"><thead><tr><th>Foto</th><th>Nome</th><th>Nacionalidade</th><th>Nascimento</th><th>Livros</th><th>Ações</th></tr></thead><tbody>';
    linhas.forEach(function (a) {
      var qtd = DB.qtdLivrosDoAutor(a.id);
      html += '<tr><td data-rotulo="Foto">' + botaoFoto(a) + '</td>'
        + '<td data-rotulo="Nome"><strong class="aut-nome">' + h(a.nome) + '</strong></td>'
        + '<td data-rotulo="Nacionalidade"><span class="aut-nac">' + h(a.nacionalidade) + '</span></td>'
        + '<td data-rotulo="Nascimento">' + h(App.dataBR(a.data_nascimento)) + ' <span class="aut-seculo">' + seculo(a.data_nascimento) + '</span></td>'
        + '<td data-rotulo="Livros"><span class="aut-livros">' + qtd + '</span></td>'
        + '<td><div class="col-acoes"><a class="btn btn-sec" href="autor_form.html?id=' + a.id + '">Editar</a>'
        + '<form data-excluir-autor="' + a.id + '" data-confirmar="Excluir o autor &quot;' + h(a.nome) + '&quot;?"><button class="btn btn-perigo" type="submit">Excluir</button></form></div></td></tr>';
    });
    html += '</tbody></table></div>';
    var pag = '';
    if (paginas > 1) {
      pag = '<nav class="aut-pag" aria-label="Páginas de autores"><button type="button" data-pag="' + (estAut.pag - 1) + '"' + (estAut.pag === 1 ? ' disabled' : '') + ' aria-label="Página anterior">‹</button>';
      for (var i = 1; i <= paginas; i++) {
        pag += '<button type="button" data-pag="' + i + '"' + (i === estAut.pag ? ' aria-current="page"' : '') + '>' + i + '</button>';
      }
      pag += '<button type="button" data-pag="' + (estAut.pag + 1) + '"' + (estAut.pag === paginas ? ' disabled' : '') + ' aria-label="Próxima página">›</button></nav>';
    }
    html += '<div class="aut-rodape"><span>Mostrando ' + (ini + 1) + '–' + (ini + linhas.length) + ' de ' + lista.length + (lista.length === 1 ? ' autor' : ' autores') + '</span>' + pag + '</div>';
    el.innerHTML = html;
  }

  // ---- visualizador de foto (usa <dialog>: foco preso, Esc fecha, leitor de tela anuncia)
  var visor = null, visorLista = [], visorIdx = 0, visorGatilho = null;

  function montarVisor() {
    if (visor) { return visor; }
    visor = document.createElement('dialog');
    visor.className = 'visor';
    visor.setAttribute('aria-labelledby', 'visor-nome');
    visor.innerHTML = '<button type="button" class="visor-x" aria-label="Fechar foto">×</button>'
      + '<div class="visor-foto" id="visor-foto"></div>'
      + '<h2 id="visor-nome"></h2><p class="visor-meta" id="visor-meta"></p>'
      + '<p class="visor-vazio" id="visor-vazio" hidden>Este autor ainda não tem foto cadastrada.</p>'
      + '<div class="visor-nav"><button type="button" class="btn btn-sec" id="visor-ant" aria-label="Autor anterior">‹ Anterior</button>'
      + '<span id="visor-cont" aria-live="polite"></span>'
      + '<button type="button" class="btn btn-sec" id="visor-prox" aria-label="Próximo autor">Próximo ›</button></div>'
      + '<a class="btn" id="visor-editar" href="#">Alterar foto</a>';
    document.body.appendChild(visor);
    visor.querySelector('.visor-x').addEventListener('click', function () { visor.close(); });
    visor.querySelector('#visor-ant').addEventListener('click', function () { passarVisor(-1); });
    visor.querySelector('#visor-prox').addEventListener('click', function () { passarVisor(1); });
    visor.addEventListener('click', function (e) { if (e.target === visor) { visor.close(); } });
    visor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { passarVisor(-1); } else if (e.key === 'ArrowRight') { passarVisor(1); }
    });
    visor.addEventListener('close', function () {
      if (visorGatilho && document.body.contains(visorGatilho)) { try { visorGatilho.focus(); } catch (e) {} }
    });
    return visor;
  }

  function mostrarVisor() {
    var a = visorLista[visorIdx]; if (!a) { return; }
    var qtd = DB.qtdLivrosDoAutor(a.id);
    document.getElementById('visor-foto').innerHTML = a.capa
      ? '<img class="visor-img" src="' + h(App.srcImagem(a.capa)) + '" alt="Foto de ' + h(a.nome) + '">'
      : '<span class="visor-inicial" role="img" aria-label="Sem foto de ' + h(a.nome) + '">' + h(a.nome.charAt(0).toUpperCase()) + '</span>';
    document.getElementById('visor-nome').textContent = a.nome;
    document.getElementById('visor-meta').textContent = a.nacionalidade + ' · ' + App.dataBR(a.data_nascimento) + ' (' + seculo(a.data_nascimento) + ') · ' + qtd + (qtd === 1 ? ' livro' : ' livros');
    document.getElementById('visor-vazio').hidden = !!a.capa;
    document.getElementById('visor-cont').textContent = (visorIdx + 1) + ' de ' + visorLista.length;
    document.getElementById('visor-editar').textContent = a.capa ? 'Alterar foto' : 'Adicionar foto';
    document.getElementById('visor-editar').href = 'autor_form.html?id=' + a.id;
    document.getElementById('visor-ant').disabled = document.getElementById('visor-prox').disabled = visorLista.length < 2;
  }

  function passarVisor(d) {
    if (visorLista.length < 2) { return; }
    visorIdx = (visorIdx + d + visorLista.length) % visorLista.length;
    mostrarVisor();
  }

  function abrirVisor(id, gatilho) {
    visorLista = autoresFiltrados(DB.autores());
    visorIdx = visorLista.findIndex(function (a) { return a.id === id; });
    if (visorIdx < 0) { return; }
    visorGatilho = gatilho;
    var v = montarVisor(); mostrarVisor();
    if (v.showModal) { v.showModal(); } else { v.setAttribute('open', ''); }
    v.querySelector('.visor-x').focus();
  }

  function autores() {
    var todos = DB.autores();
    var nacs = {}, totalLivros = 0;
    todos.forEach(function (a) { if (a.nacionalidade) { nacs[a.nacionalidade] = 1; } totalLivros += DB.qtdLivrosDoAutor(a.id); });
    var nomesNac = Object.keys(nacs).sort(function (x, y) { return x.localeCompare(y, 'pt'); });
    var ordens = [['nome', 'Nome (A–Z)'], ['nome-desc', 'Nome (Z–A)'], ['nasc', 'Mais antigos primeiro'], ['nasc-desc', 'Mais recentes primeiro'], ['livros', 'Mais livros']];
    var html = '<div class="cabecalho-pagina"><div><h1>Autores</h1><p class="aut-resumo"><strong>' + todos.length + '</strong> autores · <strong>' + totalLivros
      + '</strong> livros · <strong>' + nomesNac.length + '</strong> nacionalidades</p></div><a class="btn" href="autor_form.html">+ Novo autor</a></div>';
    html += '<div class="aut-barra"><label class="aut-busca"><span class="aut-sr">Buscar autor</span>'
      + '<input id="aut-q" type="search" placeholder="Buscar por nome ou nacionalidade" autocomplete="off" value="' + h(estAut.q) + '"></label>'
      + '<label><span class="aut-sr">Filtrar por nacionalidade</span><select id="aut-nac"><option value="">Todas as nacionalidades</option>'
      + nomesNac.map(function (n) { return '<option value="' + h(n) + '"' + (n === estAut.nac ? ' selected' : '') + '>' + h(n) + '</option>'; }).join('') + '</select></label>'
      + '<label><span class="aut-sr">Ordenar por</span><select id="aut-ord">'
      + ordens.map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === estAut.ord ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label></div>';
    html += '<div id="aut-lista" aria-live="polite"></div>';
    App.Layout.montar('Autores', html);

    document.getElementById('aut-q').addEventListener('input', function (e) { estAut.q = e.target.value; estAut.pag = 1; desenharListaAutores(); });
    document.getElementById('aut-nac').addEventListener('change', function (e) { estAut.nac = e.target.value; estAut.pag = 1; desenharListaAutores(); });
    document.getElementById('aut-ord').addEventListener('change', function (e) { estAut.ord = e.target.value; estAut.pag = 1; desenharListaAutores(); });
    document.getElementById('aut-lista').addEventListener('click', function (e) {
      var f = e.target.closest('[data-foto]'), p = e.target.closest('[data-pag]');
      if (f) { abrirVisor(parseInt(f.dataset.foto, 10), f); }
      else if (p && !p.disabled) { estAut.pag = parseInt(p.dataset.pag, 10); desenharListaAutores(); }
    });
    desenharListaAutores();
  }

  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.dataset && f.dataset.excluirAutor) {
      e.preventDefault();
      try {
        DB.excluirAutor(parseInt(f.dataset.excluirAutor, 10));
        App.flash('ok', 'Autor excluído com sucesso.');
      } catch (err) {
        // FK = autor ainda possui livros (ON DELETE RESTRICT)
        App.flash('erro', err.code === 'FK'
          ? 'Não é possível excluir: este autor possui livros cadastrados. Exclua os livros primeiro.'
          : 'Erro ao excluir o autor.');
      }
      autores();
    } else if (f.dataset && f.dataset.excluirLivro) {
      e.preventDefault();
      DB.excluirLivro(parseInt(f.dataset.excluirLivro, 10));
      App.flash('ok', 'Livro excluído com sucesso.');
      livros();
    }
  });

  // ------------------------------------------------------------ autor_form.html
  function autorForm(dados, erros) {
    var id = App.paramInt('id');
    App.Layout.montar(id ? 'Editar autor' : 'Novo autor',
      '<h1>' + (id ? 'Editar autor' : 'Novo autor') + '</h1>' + App.Layout.erros(erros)
      + '<form id="form" class="formulario" novalidate>'
      + '<label>Nome <input type="text" name="nome" maxlength="120" required value="' + h(dados.nome) + '"></label>'
      + '<label>Nacionalidade <input type="text" name="nacionalidade" maxlength="60" required value="' + h(dados.nacionalidade) + '"></label>'
      + '<label>Data de nascimento <input type="date" name="data_nascimento" required max="' + App.hoje() + '" value="' + h(dados.data_nascimento) + '"></label>'
      + '<label>Capa / foto do autor (opcional) <input type="file" name="capa" accept="image/jpeg,image/png,image/webp"></label>'
      + (dados.capa ? '<img class="capa-previa" src="' + h(App.srcImagem(dados.capa)) + '" alt="Foto atual do autor">' : '')
      + '<div class="acoes"><button class="btn" type="submit">Salvar</button><a class="btn btn-sec" href="autores.html">Cancelar</a></div></form>');

    document.getElementById('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, erros = [];
      var d = { nome: f.nome.value.trim(), nacionalidade: f.nacionalidade.value.trim(), data_nascimento: f.data_nascimento.value.trim(), capa: dados.capa };
      if (d.nome === '' || d.nome.length > 120) { erros.push('Informe o nome do autor (até 120 caracteres).'); }
      if (d.nacionalidade === '' || d.nacionalidade.length > 60) { erros.push('Informe a nacionalidade (até 60 caracteres).'); }
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d.data_nascimento);
      var dt = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
      if (!dt || dt.getFullYear() !== +m[1] || dt.getMonth() !== +m[2] - 1 || dt.getDate() !== +m[3]) {
        erros.push('Informe uma data de nascimento válida.');
      } else if (d.data_nascimento > App.hoje()) {
        erros.push('A data de nascimento não pode estar no futuro.');
      }
      if (erros.length) { return autorForm(d, erros); }

      App.lerCapa(f.capa).then(function (r) {
        if (r.erro) { return autorForm(d, [r.erro]); }
        var dadosSalvar = { nome: d.nome, nacionalidade: d.nacionalidade, data_nascimento: d.data_nascimento, capa: r.dados };
        try {
          if (id) { DB.atualizarAutor(id, dadosSalvar); } else { DB.inserirAutor(dadosSalvar); }
          App.flash('ok', id ? 'Autor atualizado com sucesso.' : 'Autor cadastrado com sucesso.');
          App.redirecionar('autores.html');
        } catch (err) {
          autorForm(d, [erroSalvar(err, 'Erro ao salvar o autor.')]);
        }
      });
    });
  }

  // ------------------------------------------------------------ livros.html
  var estLiv = { q: '', cat: null, ord: 't', v: 't', p: 1, PP: 10 };
  var LV_ICO = {
    ver: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    ed: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    ex: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>'
  };
  function lvBotao(tipo, id, titulo) {
    var url = tipo === 'ver' ? 'livro.html?id=' + id : tipo === 'ed' ? 'livro_form.html?id=' + id : '';
    var svg = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + LV_ICO[tipo] + '</svg>';
    return url
      ? '<a class="lv-ic" href="' + url + '" title="' + titulo + '" aria-label="' + titulo + '">' + svg + '</a>'
      : '<button type="button" class="lv-ic lv-x" data-excluir="' + id + '" title="' + titulo + '" aria-label="' + titulo + '">' + svg + '</button>';
  }
  function lvAcoes(id) { return '<div class="lv-ac">' + lvBotao('ver', id, 'Ver') + lvBotao('ed', id, 'Editar') + lvBotao('ex', id, 'Excluir') + '</div>'; }
  function lvCapa(l) {
    return l.capa ? '<img class="lv-cp" src="' + h(App.srcImagem(l.capa)) + '" alt="Capa de ' + h(l.t) + '" loading="lazy">' : '<span class="lv-cp">📖</span>';
  }

  function livros() {
    var todos = DB.livros().map(function (l) {
      var a = DB.autor(l.autor_id), c = DB.categoria(l.categoria_id);
      return { id: l.id, t: l.titulo, a: a ? a.nome : '', y: l.ano_publicacao, n: l.isbn || '', c: c ? c.nome : 'Sem categoria', capa: l.capa };
    });
    var $ = function (id) { return document.getElementById(id); };

    App.Layout.montar('Livros',
      '<div class="cabecalho-pagina"><div><h1>Livros</h1><p class="lv-sub" id="lv-cnt"></p></div>'
      + '<div class="cab-acoes"><a class="btn" href="livro_form.html">+ Novo livro</a></div></div>'
      + '<div class="lv-bar"><div class="lv-busca"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
      + '<input id="lv-q" type="search" placeholder="Buscar por título, autor ou ISBN..." autocomplete="off" aria-label="Buscar livros"></div>'
      + '<select id="lv-ord" aria-label="Ordenar livros"><option value="t">Título (A–Z)</option><option value="a">Autor (A–Z)</option><option value="yd">Mais recentes</option><option value="ya">Mais antigos</option></select>'
      + '<div class="lv-vis" id="lv-vis"><button type="button" data-v="t">☰ Lista</button><button type="button" data-v="g">▦ Grade</button></div></div>'
      + '<div class="lv-chips" id="lv-chips"></div><div id="lv-lista"></div><div class="lv-pg" id="lv-pg"></div>'
      + '<div class="lv-mod" id="lv-mod" hidden><div class="lv-mc" role="dialog" aria-modal="true" aria-labelledby="lv-mt"><h3 id="lv-mt">Excluir livro?</h3><p id="lv-mp"></p>'
      + '<div><button type="button" class="btn btn-sec" id="lv-nao">Cancelar</button><button type="button" class="btn btn-perigo" id="lv-sim">Excluir</button></div></div></div>');

    $('lv-q').value = estLiv.q; $('lv-ord').value = estLiv.ord;
    Array.prototype.forEach.call($('lv-vis').children, function (b) { b.classList.toggle('on', b.dataset.v === estLiv.v); });

    function filtrar() {
      var q = estLiv.q.toLowerCase();
      var r = todos.filter(function (l) {
        return (!estLiv.cat || l.c === estLiv.cat) && (!q || (l.t + ' ' + l.a + ' ' + l.n).toLowerCase().indexOf(q) > -1);
      });
      var o = estLiv.ord;
      r.sort(function (a, b) {
        if (o === 'yd') { return (b.y || 0) - (a.y || 0); }
        if (o === 'ya') { return (a.y || 0) - (b.y || 0); }
        var k = o === 'a' ? 'a' : 't';
        return a[k].localeCompare(b[k], 'pt');
      });
      return r;
    }
    function chips() {
      var n = {};
      todos.forEach(function (l) { n[l.c] = (n[l.c] || 0) + 1; });
      var ks = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; });
      $('lv-chips').innerHTML = '<button type="button" class="lv-chip' + (estLiv.cat ? '' : ' on') + '" data-c="">Todos<small>' + todos.length + '</small></button>'
        + ks.map(function (c) { return '<button type="button" class="lv-chip' + (estLiv.cat === c ? ' on' : '') + '" data-c="' + h(c) + '">' + h(c) + '<small>' + n[c] + '</small></button>'; }).join('');
    }
    function desenhar() {
      var r = filtrar(), np = Math.max(1, Math.ceil(r.length / estLiv.PP));
      if (estLiv.p > np) { estLiv.p = np; }
      var pg = r.slice((estLiv.p - 1) * estLiv.PP, estLiv.p * estLiv.PP);
      $('lv-cnt').textContent = todos.length + (todos.length === 1 ? ' livro' : ' livros') + ' no acervo' + (r.length !== todos.length ? ' · ' + r.length + ' encontrados' : '');
      var html;
      if (!todos.length) {
        html = '<p class="vazio">Nenhum livro cadastrado ainda.</p>';
      } else if (!r.length) {
        html = '<div class="lv-tab lv-vz"><div>🔍</div><p>Nenhum livro encontrado. <button type="button" class="lv-chip" id="lv-lim">limpar filtros</button></p></div>';
      } else if (estLiv.v === 'g') {
        html = '<div class="lv-gr">' + pg.map(function (l) {
          return '<div class="lv-cd">' + lvCapa(l) + '<b>' + h(l.t) + '</b><small>' + h(l.a) + (l.y ? ' · ' + l.y : '') + '</small>' + lvAcoes(l.id) + '</div>';
        }).join('') + '</div>';
      } else {
        html = '<div class="lv-tab"><div class="lv-lin lv-th"><span></span><button type="button" data-o="t">Título ↕</button><button type="button" data-o="a">Autor ↕</button><button type="button" data-o="yd">Ano ↕</button><span>ISBN</span><span></span></div>'
          + pg.map(function (l) {
            return '<div class="lv-lin">' + lvCapa(l) + '<div class="lv-ti"><b>' + h(l.t) + '</b><span>' + h(l.c) + '</span></div><div class="lv-au">' + h(l.a) + '</div><div class="lv-an">' + (l.y || '') + '</div>'
              + '<button type="button" class="lv-isbn" data-isbn="' + h(l.n) + '" title="Copiar ISBN">' + h(l.n) + '</button>' + lvAcoes(l.id) + '</div>';
          }).join('') + '</div>';
      }
      $('lv-lista').innerHTML = html;
      var bt = '';
      for (var p = 1; p <= np; p++) { bt += '<button type="button"' + (p === estLiv.p ? ' class="on"' : '') + ' data-p="' + p + '">' + p + '</button>'; }
      $('lv-pg').innerHTML = r.length
        ? '<span>Mostrando ' + ((estLiv.p - 1) * estLiv.PP + 1) + '–' + Math.min(r.length, estLiv.p * estLiv.PP) + ' de ' + r.length + '</span>'
          + '<div><button type="button" data-p="' + (estLiv.p - 1) + '"' + (estLiv.p < 2 ? ' disabled' : '') + '>‹</button>' + bt
          + '<button type="button" data-p="' + (estLiv.p + 1) + '"' + (estLiv.p >= np ? ' disabled' : '') + '>›</button></div>'
        : '';
    }

    $('lv-chips').addEventListener('click', function (e) {
      var b = e.target.closest('.lv-chip'); if (!b) { return; }
      estLiv.cat = b.dataset.c || null; estLiv.p = 1; chips(); desenhar();
    });
    $('lv-pg').addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b || b.disabled) { return; }
      estLiv.p = parseInt(b.dataset.p, 10); desenhar(); window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    $('lv-q').addEventListener('input', function () { estLiv.q = this.value.trim(); estLiv.p = 1; desenhar(); });
    $('lv-ord').addEventListener('change', function () { estLiv.ord = this.value; estLiv.p = 1; desenhar(); });
    $('lv-vis').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) { return; }
      estLiv.v = b.dataset.v;
      Array.prototype.forEach.call($('lv-vis').children, function (x) { x.classList.toggle('on', x === b); });
      desenhar();
    });

    var alvo = null;
    function fechar() { $('lv-mod').hidden = true; alvo = null; }
    $('lv-lista').addEventListener('click', function (e) {
      var o = e.target.closest('[data-o]');
      if (o) { estLiv.ord = o.dataset.o; $('lv-ord').value = estLiv.ord; desenhar(); return; }
      if (e.target.id === 'lv-lim') { estLiv.q = ''; estLiv.cat = null; $('lv-q').value = ''; chips(); desenhar(); return; }
      var i = e.target.closest('.lv-isbn');
      if (i) {
        try { navigator.clipboard.writeText(i.dataset.isbn); } catch (x) {}
        i.classList.add('ok'); setTimeout(function () { i.classList.remove('ok'); }, 900);
        return;
      }
      var x = e.target.closest('[data-excluir]');
      if (x) {
        alvo = parseInt(x.dataset.excluir, 10);
        var l = todos.filter(function (t) { return t.id === alvo; })[0];
        $('lv-mp').textContent = '"' + (l ? l.t : '') + '" será removido do acervo, junto com os exemplares e favoritos dele.';
        $('lv-mod').hidden = false; $('lv-sim').focus();
      }
    });
    $('lv-nao').addEventListener('click', fechar);
    $('lv-mod').addEventListener('click', function (e) { if (e.target === $('lv-mod')) { fechar(); } });
    $('lv-mod').addEventListener('keydown', function (e) { if (e.key === 'Escape') { fechar(); } });
    $('lv-sim').addEventListener('click', function () {
      if (alvo === null) { return; }
      DB.excluirLivro(alvo);
      App.flash('ok', 'Livro excluído com sucesso.');
      livros();
    });

    chips(); desenhar();
  }

  // ------------------------------------------------------------ livro_form.html
  // campo => [rótulo, tamanho máximo]
  var CAMPOS_TEXTO = {
    tradutor: ['Tradutor', 120], idioma: ['Idioma', 40], material: ['Material', 40],
    numero_chamada: ['Número de chamada', 60], titulo_especial: ['Título especial', 200],
    editora: ['Editora', 120], local_publicacao: ['Local de publicação', 120],
    descricao_fisica: ['Descrição física', 120], serie: ['Série', 120],
    nota_geral: ['Nota geral', 500], assuntos: ['Assuntos', 255], resumo: ['Resumo', 5000]
  };
  var MATERIAIS = ['Livro', 'E-book', 'Periódico', 'Tese/Dissertação', 'Mídia'];

  function campoTexto(d, n, dica) {
    return '<label>' + h(CAMPOS_TEXTO[n][0]) + '<input type="text" name="' + n + '" maxlength="' + CAMPOS_TEXTO[n][1]
      + '" placeholder="' + h(dica || '') + '" value="' + h(d[n]) + '"></label>';
  }

  function dadosVazios(id) {
    var d = { titulo: '', ano_publicacao: '', isbn: '', autor_id: '', categoria_id: '', capa: '' };
    Object.keys(CAMPOS_TEXTO).forEach(function (c) { d[c] = ''; });
    if (!id) { d.material = 'Livro'; d.idioma = 'Português'; }
    return d;
  }

  function livroForm(dados, erros) {
    var id = App.paramInt('id');
    var autoresLista = DB.ordenar(DB.autores(), 'nome');
    var cats = DB.categorias();

    var html = '<h1>' + (id ? 'Editar livro' : 'Novo livro') + '</h1>' + App.Layout.erros(erros);
    if (!autoresLista.length) {
      html += '<p class="vazio">Cadastre ao menos um autor antes de adicionar livros. <a href="autor_form.html">Cadastrar autor</a></p>';
      return App.Layout.montar(id ? 'Editar livro' : 'Novo livro', html);
    }

    var optAutores = autoresLista.map(function (a) {
      return '<option value="' + a.id + '"' + (String(dados.autor_id) === String(a.id) ? ' selected' : '') + '>' + h(a.nome) + '</option>';
    }).join('');
    var optCats = ['literatura', 'estudos'].map(function (area) {
      var itens = DB.ordenar(cats.filter(function (c) { return c.area === area; }), 'nome');
      if (!itens.length) { return ''; }
      return '<optgroup label="' + (area === 'estudos' ? 'Estudos' : 'Literatura') + '">' + itens.map(function (c) {
        return '<option value="' + c.id + '"' + (String(dados.categoria_id) === String(c.id) ? ' selected' : '') + '>' + h(c.nome) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');

    html += '<form id="form" class="formulario largo" novalidate><h2 class="sub-form">Dados principais</h2>'
      + '<label>Título <input type="text" name="titulo" maxlength="200" required value="' + h(dados.titulo) + '"></label>'
      + '<div class="linha"><label>Autor <select name="autor_id" required><option value="">— selecione —</option>' + optAutores + '</select></label>'
      + campoTexto(dados, 'tradutor', 'Opcional') + '</div>'
      + '<label>Categoria <select name="categoria_id"><option value="">— sem categoria —</option>' + optCats + '</select></label>'
      + '<div class="linha"><label>Ano de publicação <input type="number" name="ano_publicacao" min="1000" max="' + App.anoMax() + '" required value="' + h(dados.ano_publicacao) + '"></label>'
      + '<label>ISBN <input type="text" name="isbn" maxlength="17" placeholder="978-85-359-1166-4" required value="' + h(dados.isbn) + '"></label></div>'
      + '<h2 class="sub-form">Catalogação <small>(opcional)</small></h2>'
      + '<div class="linha"><label>Material <select name="material">' + MATERIAIS.map(function (m) {
        return '<option' + (dados.material === m ? ' selected' : '') + '>' + h(m) + '</option>';
      }).join('') + '</select></label>' + campoTexto(dados, 'idioma', 'Português') + '</div>'
      + '<div class="linha">' + campoTexto(dados, 'numero_chamada', '820(44)-1 R575b') + campoTexto(dados, 'titulo_especial', 'Título alternativo') + '</div>'
      + '<div class="linha">' + campoTexto(dados, 'local_publicacao', 'Florianópolis') + campoTexto(dados, 'editora', 'UFSC') + '</div>'
      + '<div class="linha">' + campoTexto(dados, 'descricao_fisica', '77 p. : il. ; 21 cm.') + campoTexto(dados, 'serie', '(Coleção ; 2)') + '</div>'
      + campoTexto(dados, 'nota_geral', 'Ex.: Texto em português com tradução paralela em francês.')
      + '<label>Resumo <textarea name="resumo" rows="6" maxlength="5000">' + h(dados.resumo) + '</textarea></label>'
      + campoTexto(dados, 'assuntos', 'Separe por vírgula: Poesia francesa, Romance')
      + '<label>Capa do livro (opcional) <input type="file" name="capa" accept="image/jpeg,image/png,image/webp"></label>'
      + (dados.capa ? '<img class="capa-previa" src="' + h(App.srcImagem(dados.capa)) + '" alt="Capa atual do livro">' : '')
      + '<div class="acoes"><button class="btn" type="submit">Salvar</button>'
      + '<a class="btn btn-sec" href="' + (id ? 'livro.html?id=' + id : 'livros.html') + '">Cancelar</a></div></form>';
    App.Layout.montar(id ? 'Editar livro' : 'Novo livro', html);

    document.getElementById('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, erros = [], d = { capa: dados.capa };
      ['titulo', 'ano_publicacao', 'isbn', 'autor_id', 'categoria_id'].forEach(function (c) { d[c] = f[c].value.trim(); });
      Object.keys(CAMPOS_TEXTO).forEach(function (c) {
        d[c] = f[c].value.trim();
        if (d[c].length > CAMPOS_TEXTO[c][1]) { erros.push('O campo "' + CAMPOS_TEXTO[c][0] + '" aceita até ' + CAMPOS_TEXTO[c][1] + ' caracteres.'); }
      });
      if (d.material !== '' && MATERIAIS.indexOf(d.material) < 0) { erros.push('Material inválido.'); }
      if (d.titulo === '' || d.titulo.length > 200) { erros.push('Informe o título do livro (até 200 caracteres).'); }

      var anoMax = App.anoMax();
      var ano = /^\d+$/.test(d.ano_publicacao) ? parseInt(d.ano_publicacao, 10) : NaN;
      if (isNaN(ano) || ano < 1000 || ano > anoMax) { erros.push('Informe um ano de publicação válido (1000 a ' + anoMax + ').'); }

      // ISBN: aceita hifens/espaços; precisa ter 10 ou 13 dígitos (ISBN-10 pode terminar em X)
      var isbnLimpo = d.isbn.replace(/[\s-]/g, '').toUpperCase();
      if (!/^(\d{13}|\d{9}[\dX])$/.test(isbnLimpo)) { erros.push('ISBN inválido: informe 10 ou 13 dígitos.'); }

      var autorId = /^\d+$/.test(d.autor_id) ? parseInt(d.autor_id, 10) : NaN;
      if (isNaN(autorId)) { erros.push('Selecione um autor.'); }
      else if (!DB.autor(autorId)) { erros.push('O autor selecionado não existe.'); }

      var catId = null;   // categoria é opcional
      if (d.categoria_id !== '') {
        catId = parseInt(d.categoria_id, 10);
        if (isNaN(catId) || !DB.categoria(catId)) { erros.push('A categoria selecionada não existe.'); }
      }
      if (erros.length) { return livroForm(d, erros); }

      App.lerCapa(f.capa).then(function (r) {
        if (r.erro) { return livroForm(d, ['Capa inválida: envie uma imagem JPG, PNG ou WEBP de até 2 MB.']); }
        var salvar = { titulo: d.titulo, ano_publicacao: ano, isbn: isbnLimpo, autor_id: autorId, categoria_id: catId, capa: r.dados };
        Object.keys(CAMPOS_TEXTO).forEach(function (c) { salvar[c] = d[c] === '' ? null : d[c]; });
        try {
          var novoId = id;
          if (id) { DB.atualizarLivro(id, salvar); } else { novoId = DB.inserirLivro(salvar); }
          App.flash('ok', id ? 'Livro atualizado com sucesso.' : 'Livro cadastrado. Adicione os exemplares abaixo.');
          App.redirecionar('livro.html?id=' + novoId);
        } catch (err) {
          livroForm(d, [err.code === 'DUP' ? 'Já existe um livro cadastrado com este ISBN.' : erroSalvar(err, 'Erro ao salvar o livro.')]);
        }
      });
    });
  }

  function livroFormInicio() {
    var id = App.paramInt('id');
    var dados = dadosVazios(id);
    if (id) {
      var l = DB.livro(id);
      if (!l) {
        App.flash('erro', 'Livro não encontrado.');
        return App.redirecionar('livros.html');
      }
      dados = { titulo: l.titulo, ano_publicacao: l.ano_publicacao, isbn: l.isbn, autor_id: l.autor_id, categoria_id: l.categoria_id == null ? '' : l.categoria_id, capa: l.capa || '' };
      Object.keys(CAMPOS_TEXTO).forEach(function (c) { dados[c] = l[c] == null ? '' : l[c]; });
    }
    livroForm(dados);
  }

  function autorFormInicio() {
    var id = App.paramInt('id');
    var dados = { nome: '', nacionalidade: '', data_nascimento: '', capa: '' };
    if (id) {
      var a = DB.autor(id);
      if (!a) {
        App.flash('erro', 'Autor não encontrado.');
        return App.redirecionar('autores.html');
      }
      dados = { nome: a.nome, nacionalidade: a.nacionalidade, data_nascimento: a.data_nascimento, capa: a.capa || '' };
    }
    autorForm(dados);
  }

  window.Paginas = window.Paginas || {};
  window.Paginas.index = function () { App.iniciar(painel); };
  window.Paginas.autores = function () { App.iniciar(autores); };
  window.Paginas.autor_form = function () { App.iniciar(autorFormInicio); };
  window.Paginas.livros = function () { App.iniciar(livros); };
  window.Paginas.livro_form = function () { App.iniciar(livroFormInicio); };
})();
