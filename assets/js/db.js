/* =====================================================================
   db.js — "banco de dados" do site, no navegador.
   Substitui o MySQL/PDO do PHP. As tabelas têm os mesmos nomes e colunas
   do banco.sql e começam com os dados de js/data.js (window.SEED).
   Alterações (novos livros, favoritos, contas...) ficam no localStorage.
   ===================================================================== */
(function () {
  var CHAVE = 'biblioteca_db_v1';
  var estado = null;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function carregar() {
    try {
      var s = localStorage.getItem(CHAVE);
      if (s) { return JSON.parse(s); }
    } catch (e) {}
    return null;
  }

  // Se o navegador bloqueia o localStorage (janela anônima, por ex.), o site funciona só em memória.
  var armazenamentoOk = true;
  try { localStorage.setItem('biblioteca_teste', '1'); localStorage.removeItem('biblioteca_teste'); } catch (e) { armazenamentoOk = false; }

  function salvar() {
    if (!armazenamentoOk) { return; }
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      // cota cheia (capas grandes): desfaz na memória não é possível aqui; avisa quem chamou
      var err = new Error('Sem espaço para salvar no navegador.');
      err.code = 'QUOTA';
      throw err;
    }
  }

  estado = carregar() || clone(window.SEED);

  // capas antigas (arquivos de uploads/) informadas em js/capas.js — só preenche quem ainda não tem capa
  (function () {
    var C = window.CAPAS || {};
    estado.livros.forEach(function (l) { if (!l.capa && C.livros && C.livros[l.id]) { l.capa = C.livros[l.id]; } });
    estado.autores.forEach(function (a) { if (!a.capa && C.autores && C.autores[a.id]) { a.capa = C.autores[a.id]; } });
  })();

  function proximoId(tabela) {
    return tabela.reduce(function (m, r) { return Math.max(m, r.id); }, 0) + 1;
  }
  function erro(codigo, msg) { var e = new Error(msg || codigo); e.code = codigo; return e; }

  // compara como o MySQL (utf8mb4_unicode_ci): sem maiúsculas e sem acentos
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function ordenar(lista, campo) {
    return lista.slice().sort(function (a, b) {
      return String(a[campo]).localeCompare(String(b[campo]), 'pt-BR', { sensitivity: 'base' });
    });
  }

  var DB = {
    norm: norm,
    ordenar: ordenar,

    // ---------- leitura ----------
    autores: function () { return estado.autores.slice(); },
    autor: function (id) { return estado.autores.find(function (a) { return a.id === id; }) || null; },
    categorias: function () { return estado.categorias.slice(); },
    categoria: function (id) { return estado.categorias.find(function (c) { return c.id === id; }) || null; },
    livros: function () { return estado.livros.slice(); },
    livro: function (id) { return estado.livros.find(function (l) { return l.id === id; }) || null; },
    exemplares: function (livroId) {
      return ordenar(estado.exemplares.filter(function (e) { return e.livro_id === livroId; }), 'tombo');
    },
    qtdLivrosDoAutor: function (autorId) {
      return estado.livros.filter(function (l) { return l.autor_id === autorId; }).length;
    },
    totalFavoritosLivro: function (livroId) {
      return estado.favoritos_livros.filter(function (f) { return f.livro_id === livroId; }).length;
    },
    ehFavorito: function (tipo, usuarioId, id) {
      var t = tipo === 'livro' ? estado.favoritos_livros : estado.favoritos_autores;
      var col = tipo === 'livro' ? 'livro_id' : 'autor_id';
      return t.some(function (f) { return f.usuario_id === usuarioId && f[col] === id; });
    },
    favoritos: function (tipo, usuarioId) {
      var t = tipo === 'livro' ? estado.favoritos_livros : estado.favoritos_autores;
      var col = tipo === 'livro' ? 'livro_id' : 'autor_id';
      return t.filter(function (f) { return f.usuario_id === usuarioId; }).map(function (f) { return f[col]; });
    },

    // ---------- favoritos (liga/desliga) ----------
    alternarFavorito: function (tipo, usuarioId, id) {
      var t = tipo === 'livro' ? estado.favoritos_livros : estado.favoritos_autores;
      var col = tipo === 'livro' ? 'livro_id' : 'autor_id';
      var existe = tipo === 'livro' ? !!DB.livro(id) : !!DB.autor(id);
      if (!existe) { return false; }
      var i = t.findIndex(function (f) { return f.usuario_id === usuarioId && f[col] === id; });
      if (i >= 0) { t.splice(i, 1); } else { var n = { usuario_id: usuarioId }; n[col] = id; t.push(n); }
      salvar();
      return i < 0;
    },

    // ---------- usuários ----------
    usuarioPorEmail: function (email) {
      return estado.usuarios.find(function (u) { return u.email === email; }) || null;
    },
    inserirUsuario: function (d) {
      if (DB.usuarioPorEmail(d.email)) { throw erro('DUP', 'Este e-mail já está cadastrado.'); }
      var u = { id: proximoId(estado.usuarios), email: d.email, senha_hash: d.senha_hash, codigo: null, papel: d.papel, criado_em: new Date().toISOString() };
      estado.usuarios.push(u);
      salvar();
      return u.id;
    },

    // ---------- autores ----------
    inserirAutor: function (d) {
      var a = { id: proximoId(estado.autores), nome: d.nome, nacionalidade: d.nacionalidade, data_nascimento: d.data_nascimento, capa: d.capa || null };
      estado.autores.push(a);
      try { salvar(); } catch (e) { estado.autores.pop(); throw e; }
      return a.id;
    },
    atualizarAutor: function (id, d) {
      var a = DB.autor(id), ant = clone(a);
      a.nome = d.nome; a.nacionalidade = d.nacionalidade; a.data_nascimento = d.data_nascimento;
      if (d.capa) { a.capa = d.capa; }          // COALESCE(:capa, capa)
      try { salvar(); } catch (e) { Object.assign(a, ant); throw e; }
    },
    excluirAutor: function (id) {
      // ON DELETE RESTRICT: não exclui autor que ainda tem livros
      if (DB.qtdLivrosDoAutor(id) > 0) { throw erro('FK', 'Autor possui livros.'); }
      estado.autores = estado.autores.filter(function (a) { return a.id !== id; });
      estado.favoritos_autores = estado.favoritos_autores.filter(function (f) { return f.autor_id !== id; });   // ON DELETE CASCADE
      salvar();
    },

    // ---------- livros ----------
    inserirLivro: function (d) {
      if (estado.livros.some(function (l) { return l.isbn === d.isbn; })) { throw erro('DUP', 'ISBN duplicado.'); }   // UNIQUE isbn
      var l = Object.assign({ id: proximoId(estado.livros), capa: null, link_leitura: null }, d);
      estado.livros.push(l);
      try { salvar(); } catch (e) { estado.livros.pop(); throw e; }
      return l.id;
    },
    atualizarLivro: function (id, d) {
      if (estado.livros.some(function (l) { return l.isbn === d.isbn && l.id !== id; })) { throw erro('DUP', 'ISBN duplicado.'); }
      var l = DB.livro(id), ant = clone(l);
      var capa = d.capa || l.capa;
      Object.assign(l, d, { capa: capa });
      try { salvar(); } catch (e) { Object.assign(l, ant); throw e; }
    },
    definirLinkLeitura: function (id, url) {
      DB.livro(id).link_leitura = url || null;
      salvar();
    },
    excluirLivro: function (id) {
      estado.livros = estado.livros.filter(function (l) { return l.id !== id; });
      estado.exemplares = estado.exemplares.filter(function (e) { return e.livro_id !== id; });                  // ON DELETE CASCADE
      estado.favoritos_livros = estado.favoritos_livros.filter(function (f) { return f.livro_id !== id; });      // ON DELETE CASCADE
      salvar();
    },

    // ---------- exemplares ----------
    inserirExemplar: function (d) {
      if (estado.exemplares.some(function (e) { return e.tombo === d.tombo; })) { throw erro('DUP', 'Tombo duplicado.'); }   // UNIQUE tombo
      estado.exemplares.push({ id: proximoId(estado.exemplares), livro_id: d.livro_id, tombo: d.tombo, ano: d.ano, biblioteca: d.biblioteca, situacao: d.situacao });
      salvar();
    },
    excluirExemplar: function (id, livroId) {
      estado.exemplares = estado.exemplares.filter(function (e) { return !(e.id === id && e.livro_id === livroId); });
      salvar();
    }
  };

  window.DB = DB;
})();
