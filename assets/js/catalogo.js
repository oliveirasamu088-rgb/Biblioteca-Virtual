/* catalogo.js — catalogo.html, estudos.html, favoritos.html e autores_lista.html
   (eram catalogo.php, estudos.php, favoritos.php e autores_lista.php) */
(function () {
  var h = App.h;

  /** Livros com o nome do autor e o "fav" do usuário (o JOIN do SQL). */
  function livrosComAutor() {
    var u = App.usuarioId();
    return DB.livros().map(function (l) {
      var a = DB.autor(l.autor_id);
      var c = l.categoria_id ? DB.categoria(l.categoria_id) : null;
      return Object.assign({}, l, {
        autor_nome: a ? a.nome : null,
        area: c ? c.area : null,
        fav: DB.ehFavorito('livro', u, l.id) ? 1 : 0
      });
    }).filter(function (l) { return l.autor_nome !== null; });   // INNER JOIN autores
  }

  function secao(rotulo, livros, id) {
    var html = '<section class="secao-livros" aria-labelledby="' + h(id) + '">'
      + '<div class="secao-cab"><h2 id="' + h(id) + '">' + h(rotulo) + '</h2>';
    if (livros.length) {
      html += '<div class="setas" hidden>'
        + '<button type="button" class="seta" data-dir="-1" aria-label="Anterior">&#8249;</button>'
        + '<button type="button" class="seta" data-dir="1" aria-label="Próximo">&#8250;</button></div>';
    }
    html += '</div>';
    if (!livros.length) { return html + '<p class="vazio">Nenhum livro encontrado.</p></section>'; }
    return html + '<div class="carrossel"><div class="trilho">' + livros.map(App.cardLivro).join('') + '</div></div></section>';
  }

  /** Setas do carrossel: só aparecem se houver o que rolar; desativam nas pontas. */
  function ligarCarrosseis() {
    document.querySelectorAll('.secao-livros').forEach(function (sec) {
      var trilho = sec.querySelector('.trilho'), setas = sec.querySelector('.setas');
      if (!trilho || !setas) { return; }
      var ant = setas.querySelector('[data-dir="-1"]'), prox = setas.querySelector('[data-dir="1"]');
      function atualizar() {
        var sobra = trilho.scrollWidth - trilho.clientWidth;
        setas.hidden = sobra <= 2;
        ant.disabled = trilho.scrollLeft <= 4;
        prox.disabled = trilho.scrollLeft >= sobra - 4;
      }
      setas.querySelectorAll('.seta').forEach(function (b) {
        b.addEventListener('click', function () { trilho.scrollBy({ left: b.dataset.dir * trilho.clientWidth * 0.9 }); });
      });
      trilho.addEventListener('scroll', atualizar, { passive: true });
      window.addEventListener('resize', atualizar);
      window.addEventListener('load', atualizar);   // depois das capas carregarem
      atualizar();
    });
    document.querySelectorAll('.chips a[href*="#cat-"]').forEach(function (a) {
      a.addEventListener('click', function () {
        var el = document.getElementById(a.getAttribute('href').split('#')[1]);
        if (el) { el.classList.remove('piscar'); void el.offsetWidth; el.classList.add('piscar'); }
      });
    });
  }

  // ------------------------------------------------------------ catalogo.html / estudos.html
  function catalogo(area) {
    var pag = area === 'estudos' ? 'estudos.html' : 'catalogo.html';
    var q = (App.param('q') || '').trim();
    var catSel = App.paramInt('categoria'), autorSel = App.paramInt('autor');
    var filtrado = q !== '' || catSel || autorSel;

    function naArea(l) {
      if (autorSel) { return true; }   // livros do autor, de qualquer área
      return area === 'estudos' ? l.area === 'estudos' : (l.area === null || l.area === 'literatura');
    }

    var base = livrosComAutor().filter(naArea);
    var todos = base.filter(function (l) {
      if (q !== '') {
        var nq = DB.norm(q);
        if (DB.norm(l.titulo).indexOf(nq) < 0 && DB.norm(l.autor_nome).indexOf(nq) < 0 && DB.norm(l.assuntos).indexOf(nq) < 0) { return false; }
      }
      if (catSel && l.categoria_id !== catSel) { return false; }
      if (autorSel && l.autor_id !== autorSel) { return false; }
      return true;
    });
    todos = DB.ordenar(todos, 'titulo');

    var novos = [];
    if (!filtrado) {
      novos = base.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 12);   // ORDER BY id DESC LIMIT 12
    }

    var porCat = {};
    todos.forEach(function (l) { (porCat[l.categoria_id || 0] = porCat[l.categoria_id || 0] || []).push(l); });
    var categorias = DB.categorias().filter(function (c) { return c.area === area; })
      .filter(function (c) { return porCat[c.id] && porCat[c.id].length; });

    var html = '<form class="busca" id="busca" role="search"><div class="busca-campo">'
      + '<button class="busca-lupa" type="submit" aria-label="Buscar">🔍</button>'
      + '<input type="search" name="q" value="' + h(q) + '" placeholder="Buscar por título, autor ou assunto"></div></form>';

    if (categorias.length && !filtrado) {
      html += '<div class="chips chips-topo">' + categorias.map(function (c) {
        return '<a class="chip" href="' + pag + '#cat-' + c.id + '">' + h(c.nome) + '</a>';
      }).join('') + '</div>';
    }

    if (filtrado) {
      html += secao('Resultados (' + todos.length + ')', todos, 'sec-resultados')
        + '<p><a href="' + pag + '">← Limpar filtros</a></p>';
    } else {
      html += secao('Novos livros', novos, 'sec-novos') + secao('Todos os livros', todos, 'sec-todos');
      categorias.forEach(function (c) { html += secao(c.nome, porCat[c.id], 'cat-' + c.id); });
    }

    App.Layout.montar(area === 'estudos' ? 'Estudos' : 'Catálogo', html);
    document.getElementById('busca').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = e.target.q.value.trim();
      App.redirecionar(pag + (v ? '?q=' + encodeURIComponent(v) : ''));
    });
    ligarCarrosseis();
    if (location.hash) {   // chip de categoria: rola até a fileira
      var alvo = document.getElementById(location.hash.slice(1));
      if (alvo) { alvo.scrollIntoView(); }
    }
  }

  // ------------------------------------------------------------ favoritos.html
  function favoritos() {
    var u = App.usuarioId();
    var ids = DB.favoritos('livro', u);
    var livros = DB.ordenar(livrosComAutor().filter(function (l) { return ids.indexOf(l.id) >= 0; }), 'titulo');
    var idsA = DB.favoritos('autor', u);
    var autores = DB.ordenar(DB.autores().filter(function (a) { return idsA.indexOf(a.id) >= 0; }), 'nome')
      .map(function (a) { return Object.assign({}, a, { qtd: DB.qtdLivrosDoAutor(a.id), fav: 1 }); });

    var html = '<h1>Livros favoritos</h1>';
    if (!livros.length && !autores.length) {
      html += '<p class="vazio">Você ainda não favoritou nada. Toque no ♡ de um livro ou autor no <a href="catalogo.html">catálogo</a>.</p>';
    }
    if (livros.length) { html += '<h2>Livros</h2><div class="grade-livros">' + livros.map(App.cardLivro).join('') + '</div>'; }
    if (autores.length) { html += '<h2>Autores</h2><div class="grade-autores">' + autores.map(App.cardAutor).join('') + '</div>'; }
    App.Layout.montar('Livros favoritos', html);
  }

  // ------------------------------------------------------------ autores_lista.html
  function autoresLista() {
    var u = App.usuarioId();
    var q = (App.param('q') || '').trim(), nq = DB.norm(q);
    var autores = DB.autores().filter(function (a) {
      return q === '' || DB.norm(a.nome).indexOf(nq) >= 0 || DB.norm(a.nacionalidade).indexOf(nq) >= 0;
    }).map(function (a) {
      return Object.assign({}, a, { qtd: DB.qtdLivrosDoAutor(a.id), fav: DB.ehFavorito('autor', u, a.id) ? 1 : 0 });
    });
    autores = DB.ordenar(autores, 'nome');

    var html = '<h1>Autores</h1>'
      + '<form class="busca" id="busca" role="search"><div class="busca-campo">'
      + '<button class="busca-lupa" type="submit" aria-label="Buscar">🔍</button>'
      + '<input type="search" name="q" value="' + h(q) + '" placeholder="Buscar autor por nome ou nacionalidade"></div></form>';
    html += autores.length
      ? '<div class="grade-autores">' + autores.map(App.cardAutor).join('') + '</div>'
      : '<p class="vazio">Nenhum autor encontrado.</p>';
    App.Layout.montar('Autores', html);
    document.getElementById('busca').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = e.target.q.value.trim();
      App.redirecionar('autores_lista.html' + (v ? '?q=' + encodeURIComponent(v) : ''));
    });
  }

  window.Paginas = window.Paginas || {};
  window.Paginas.catalogo = function () { App.iniciar(function () { catalogo('literatura'); }); };
  window.Paginas.estudos = function () { App.iniciar(function () { catalogo('estudos'); }); };
  window.Paginas.favoritos = function () {
    App.iniciar(function () { App.aoFavoritar = favoritos; favoritos(); });
  };
  window.Paginas.autores_lista = function () { App.iniciar(autoresLista); };
})();
