/* livro.js — livro.html?id=N (era livro.php + exemplar_salvar.php + leitura_salvar.php) */
(function () {
  var h = App.h;
  var id = 0;

  function info(rotulo, valor, classe) {
    if (valor === null || valor === undefined || String(valor).trim() === '') { return ''; }
    return '<div class="info ' + (classe || '') + '"><span class="info-rotulo">' + h(rotulo) + '</span>'
      + '<span class="info-valor">' + h(valor) + '</span></div>';
  }
  function nl2br(s) { return h(s).replace(/\r?\n/g, '<br>'); }

  function desenhar() {
    var ehAutor = App.papelAtual() === 'autor';
    var l = DB.livro(id);
    if (!id || !l) {
      App.flash('erro', 'Livro não encontrado.');
      return App.redirecionar(ehAutor ? 'livros.html' : 'catalogo.html');
    }
    var autor = DB.autor(l.autor_id);
    var cat = l.categoria_id ? DB.categoria(l.categoria_id) : null;
    var totalFav = DB.totalFavoritosLivro(id);
    var fav = DB.ehFavorito('livro', App.usuarioId(), id);
    var exemplares = DB.exemplares(id);

    // Publicação no formato "Local : Editora, Ano."
    var pub;
    if (l.local_publicacao || l.editora) {
      pub = ((l.local_publicacao || '') + (l.local_publicacao && l.editora ? ' : ' : '') + (l.editora || '')).trim() + ', ' + l.ano_publicacao + '.';
    } else {
      pub = String(l.ano_publicacao);
    }
    var assuntos = String(l.assuntos || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var suporte = l.material || 'Livro';
    var lista = cat && cat.area === 'estudos' ? 'estudos.html' : 'catalogo.html';

    var html = '<p class="voltar"><a href="' + lista + '" id="voltar">← Voltar</a></p><div class="detalhe">'
      + '<aside class="detalhe-lateral"><div class="detalhe-capa">'
      + (l.capa ? '<img src="' + h(App.srcImagem(l.capa)) + '" alt="Capa de ' + h(l.titulo) + '">' : '<span class="sem-capa">Capa não disponível</span>')
      + '</div>';

    if (ehAutor) {
      html += '<a class="btn btn-sec lado-btn" href="livro_form.html?id=' + id + '">✎ Editar livro</a>';
    } else {
      html += '<form data-fav="livro" data-id="' + id + '" class="fav"><button type="submit" class="btn btn-sec lado-btn ' + (fav ? 'fav-ativo' : '') + '">'
        + (fav ? '♥ Favoritado' : '♡ Favoritar') + '</button></form>';
    }
    html += '<button type="button" class="btn btn-sec lado-btn" id="btn-link">🔗 Link do título</button>'
      + '<p class="total-fav" style="text-align:center"><span aria-hidden="true">♥</span> ' + totalFav + ' ' + (totalFav === 1 ? 'favorito' : 'favoritos') + '</p></aside>';

    html += '<section class="detalhe-principal"><h1>' + h(l.titulo) + '</h1>'
      + '<p class="detalhe-sub">' + h(autor ? autor.nome : '') + (l.tradutor ? ' : tradução de ' + h(l.tradutor) : '') + '</p>'
      + '<div class="info-quadro"><div class="info-linha tres">' + info('Material', l.material) + info('Idioma', l.idioma) + info('ISBN', l.isbn) + '</div>'
      + info('Número de chamada', l.numero_chamada) + info('Título especial', l.titulo_especial)
      + '<div class="info-linha dois">' + info('Publicação', pub) + info('Descrição física', l.descricao_fisica) + '</div>'
      + info('Série', l.serie) + info('Nota geral', l.nota_geral);

    if (l.resumo) {
      html += '<div class="info"><span class="info-rotulo">Resumo</span><div class="resumo recolhido" id="resumo">' + nl2br(l.resumo) + '</div>'
        + '<button type="button" class="ver-mais" id="ver-mais" hidden>Ver mais</button></div>';
    }
    if (cat) {
      html += '<div class="info"><span class="info-rotulo">Categoria</span><div class="chips"><a class="chip" href="' + lista + '?categoria=' + l.categoria_id + '">' + h(cat.nome) + '</a></div></div>';
    }
    if (assuntos.length) {
      html += '<div class="info"><span class="info-rotulo">Assuntos</span><div class="chips">'
        + assuntos.map(function (s) { return '<a class="chip" href="' + lista + '?q=' + encodeURIComponent(s) + '">' + h(s) + '</a>'; }).join('') + '</div></div>';
    }
    html += '<div class="info"><span class="info-rotulo">Autoria</span><div class="chips"><a class="chip" href="' + lista + '?autor=' + l.autor_id + '">' + h(autor ? autor.nome : '') + '</a>'
      + (l.tradutor ? '<span class="chip">' + h(l.tradutor) + ' <span class="chip-papel">Tradutor</span></span>' : '')
      + '</div></div></div></section></div>';

    // ---- Exemplares ----
    html += '<section class="exemplares"><h2>Exemplares</h2><p class="exemplares-resumo">Nº de exemplares: <strong>' + exemplares.length + '</strong></p>';
    if (!exemplares.length) {
      html += '<p class="vazio" style="padding:.5rem 0">Nenhum exemplar cadastrado para esta obra.</p>';
    } else {
      html += '<div class="tabela-wrap"><table><thead><tr><th>Informações do exemplar</th><th>Nº de chamada</th><th>Biblioteca</th><th>Situação</th>'
        + (ehAutor ? '<th>Ações</th>' : '') + '</tr></thead><tbody>';
      exemplares.forEach(function (e) {
        html += '<tr><td data-rotulo="Exemplar">Tombo: ' + h(e.tombo) + '<br>Ano: ' + e.ano + '<br>Suporte: ' + h(suporte) + '</td>'
          + '<td data-rotulo="Nº de chamada">' + h(l.numero_chamada || '—') + '</td>'
          + '<td data-rotulo="Biblioteca">' + h(e.biblioteca) + '</td>'
          + '<td data-rotulo="Situação"><span class="sit sit-' + (e.situacao === 'Disponível' ? 'ok' : 'nao') + '">' + h(e.situacao) + '</span></td>'
          + (ehAutor ? '<td data-rotulo="Ações"><form data-acao="excluir-exemplar" data-exemplar="' + e.id + '" data-confirmar="Remover o exemplar de tombo ' + h(e.tombo) + '?">'
            + '<button class="btn btn-perigo" type="submit">Excluir</button></form></td>' : '')
          + '</tr>';
      });
      html += '</tbody></table></div>';
    }
    if (ehAutor) {
      html += '<form data-acao="add-exemplar" class="formulario largo form-exemplar"><h3 class="sub-form">Adicionar exemplar</h3><div class="linha-4">'
        + '<label>Tombo <input type="text" name="tombo" maxlength="20" required></label>'
        + '<label>Ano <input type="number" name="ano" min="1000" max="' + App.anoMax() + '" required value="' + l.ano_publicacao + '"></label>'
        + '<label>Biblioteca <input type="text" name="biblioteca" maxlength="80" required placeholder="Biblioteca Gama"></label>'
        + '<label>Situação <select name="situacao">' + App.SITUACOES.map(function (s) { return '<option>' + h(s) + '</option>'; }).join('') + '</select></label>'
        + '</div><div class="acoes"><button class="btn" type="submit">+ Adicionar exemplar</button></div></form>';
    }
    html += '</section>';

    // ---- Leitura ----
    var link = l.link_leitura || '';
    html += '<section class="leitura" id="leitura"><h2>Leitura</h2>';
    if (link !== '') {
      html += '<p class="leitura-texto">Este livro está disponível para leitura online.</p>'
        + '<a class="btn" href="' + h(link) + '" target="_blank" rel="noopener noreferrer">📖 Ler</a>';
    } else {
      html += '<p class="vazio" style="padding:.5rem 0">Este livro ainda não tem link de leitura.</p>';
    }
    if (ehAutor) {
      html += '<form data-acao="salvar-link" class="formulario largo form-leitura"><h3 class="sub-form">' + (link !== '' ? 'Alterar link do livro' : 'Inserir livro (link de leitura)') + '</h3>'
        + '<label>Link <input type="url" name="link_leitura" maxlength="500" required placeholder="https://..." value="' + h(link) + '"></label>'
        + '<div class="acoes"><button class="btn" type="submit">Salvar link</button></div></form>';
      if (link !== '') {
        html += '<form data-acao="remover-link" data-confirmar="Remover o link de leitura deste livro?" class="form-leitura-rem">'
          + '<button class="btn btn-perigo" type="submit">Remover link</button></form>';
      }
    }
    html += '</section>';

    App.Layout.montar(l.titulo, html);
    ligar();
  }

  function ligar() {
    // "Voltar": usa o histórico se houver
    document.getElementById('voltar').addEventListener('click', function (e) {
      if (history.length > 1) { e.preventDefault(); history.back(); }
    });
    // "Ver mais" do resumo: só aparece se o texto passar do limite
    var r = document.getElementById('resumo'), b = document.getElementById('ver-mais');
    if (r && b) {
      if (r.scrollHeight > r.clientHeight + 2) { b.hidden = false; }
      b.addEventListener('click', function () {
        var recolhido = r.classList.toggle('recolhido');
        b.textContent = recolhido ? 'Ver mais' : 'Ver menos';
      });
    }
    // Copia o link da página
    var l = document.getElementById('btn-link');
    l.addEventListener('click', function () {
      var url = location.href;
      var ok = function () { l.textContent = '✔ Link copiado!'; setTimeout(function () { l.textContent = '🔗 Link do título'; }, 2000); };
      if (navigator.clipboard) { navigator.clipboard.writeText(url).then(ok, function () { prompt('Copie o link:', url); }); }
      else { prompt('Copie o link:', url); }
    });
  }

  // Ações do autor: exemplares e link de leitura
  document.addEventListener('submit', function (e) {
    var f = e.target, acao = f.dataset && f.dataset.acao;
    if (!acao) { return; }
    e.preventDefault();
    var anoMax = App.anoMax();

    if (acao === 'excluir-exemplar') {
      DB.excluirExemplar(parseInt(f.dataset.exemplar, 10), id);
      App.flash('ok', 'Exemplar removido.');
    } else if (acao === 'add-exemplar') {
      var tombo = f.tombo.value.trim(), biblioteca = f.biblioteca.value.trim(), situacao = f.situacao.value;
      var ano = /^\d+$/.test(f.ano.value.trim()) ? parseInt(f.ano.value, 10) : NaN;
      if (tombo === '' || tombo.length > 20) { App.flash('erro', 'Informe o tombo (até 20 caracteres).'); }
      else if (isNaN(ano) || ano < 1000 || ano > anoMax) { App.flash('erro', 'Informe um ano válido (1000 a ' + anoMax + ').'); }
      else if (biblioteca === '' || biblioteca.length > 80) { App.flash('erro', 'Informe a biblioteca (até 80 caracteres).'); }
      else if (App.SITUACOES.indexOf(situacao) < 0) { App.flash('erro', 'Situação inválida.'); }
      else {
        try {
          DB.inserirExemplar({ livro_id: id, tombo: tombo, ano: ano, biblioteca: biblioteca, situacao: situacao });
          App.flash('ok', 'Exemplar adicionado.');
        } catch (err) {
          App.flash('erro', err.code === 'DUP' ? 'Já existe um exemplar com este tombo.' : 'Erro ao salvar o exemplar.');
        }
      }
    } else if (acao === 'remover-link') {
      DB.definirLinkLeitura(id, null);
      App.flash('ok', 'Link de leitura removido.');
    } else if (acao === 'salvar-link') {
      var url = f.link_leitura.value.trim(), valido = false;
      try { var u = new URL(url); valido = u.protocol === 'http:' || u.protocol === 'https:'; } catch (x) {}
      if (url === '' || url.length > 500 || !valido) {
        App.flash('erro', 'Informe um link válido começando com http:// ou https:// (até 500 caracteres).');
      } else {
        DB.definirLinkLeitura(id, url);
        App.flash('ok', 'Link de leitura salvo.');
      }
    }
    desenhar();
    if (acao.indexOf('link') >= 0) { var s = document.getElementById('leitura'); if (s) { s.scrollIntoView(); } }
  });

  window.Paginas = window.Paginas || {};
  window.Paginas.livro = function () {
    App.iniciar(function () {
      id = App.paramInt('id');
      App.aoFavoritar = desenhar;
      desenhar();
    });
  };
})();
