/* auth.js — login.html e cadastro.html (visual novo em duas colunas) */
(function () {
  var h = App.h;

  function papelDaUrl() { return App.param('papel') === 'autor' ? 'autor' : 'leitor'; }

  // ---------- peças visuais ----------
  function icone(nome) {
    var d = {
      email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
      senha: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'
    }[nome];
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' + d + '</svg>';
  }

  /** Faixa de boas-vindas (esquerda) com capas reais sorteadas. */
  function lado() {
    var lista = [];
    var livros = (window.CAPAS && window.CAPAS.livros) || {};
    Object.keys(livros).forEach(function (k) { lista.push(livros[k]); });
    lista.sort(function () { return Math.random() - 0.5; });
    var pos = [[8, 22, -8], [34, 12, 6], [60, 26, -4], [16, 52, 5], [44, 48, -7], [70, 56, 7], [76, 8, 4]];
    var imgs = lista.slice(0, 7).map(function (arq, i) {
      var p = pos[i];
      return '<img src="assets/uploads/' + h(String(arq).split('/').pop()) + '" alt="" style="width:104px;left:' + p[0] + '%;top:' + p[1]
        + '%;rotate:' + p[2] + 'deg;animation-delay:' + (i * 0.7) + 's">';
    }).join('');
    return '<aside class="login-lado"><div class="login-marca">📚 Biblioteca</div>'
      + '<div class="login-pilha" aria-hidden="true">' + imgs + '</div>'
      + '<div class="login-texto"><h2>Seu acervo, sempre à mão.</h2>'
      + '<p>Entre para explorar o catálogo, favoritar livros e acompanhar seus estudos.</p></div></aside>';
  }

  /** Seletor Usuário | Autor com indicador deslizante. */
  function abas(pagina, papel) {
    var chaves = Object.keys(App.PAPEIS);
    var html = '<nav class="abas-login" data-a="' + chaves.indexOf(papel) + '"><i></i>';
    chaves.forEach(function (c) {
      html += '<a href="' + pagina + '?papel=' + c + '"' + (c === papel ? ' class="on" aria-current="page"' : '') + '>' + App.PAPEIS[c] + '</a>';
    });
    return html + '</nav>';
  }

  function campo(id, rotulo, tipo, icon, extra, valor) {
    return '<div class="lf"><label for="' + id + '">' + rotulo + '</label>'
      + '<div class="lc">' + icone(icon)
      + '<input id="' + id + '" type="' + tipo + '" name="' + id + '" ' + extra + (valor ? ' value="' + h(valor) + '"' : '') + '></div>'
      + '<div class="lm" data-for="' + id + '"></div></div>';
  }

  function tela(titulo, sub, pagina, papel, erros, form, alt) {
    App.Layout.montar(titulo,
      '<div class="login-pagina">' + lado()
      + '<section class="login-dir">'
      + '<button type="button" id="btn-tema" class="login-tema" aria-label="Alternar tema">🌓 Tema</button>'
      + '<div class="login-box"><div class="login-marca-m">📚 Biblioteca</div>'
      + '<h1>' + titulo + '</h1><p class="login-sub">' + sub + '</p>'
      + abas(pagina, papel) + App.Layout.erros(erros) + form + '<p class="login-alt">' + alt + '</p>'
      + '</div></section></div>', { semTopo: true });
  }

  // aviso de Caps Lock e (opcional) medidor de força da senha
  function extras(f) {
    var senha = f.senha, forca = document.getElementById('forca');
    var aviso = f.querySelector('.lm[data-for="senha"]');
    senha.addEventListener('keyup', function (e) {
      if (e.getModifierState && e.getModifierState('CapsLock')) { aviso.textContent = '⚠ Caps Lock está ligado'; aviso.className = 'lm i'; }
      else { aviso.textContent = ''; }
    });
    if (forca) {
      senha.addEventListener('input', function () {
        var v = senha.value, n = 0;
        if (v.length >= 6) { n = 1; }
        if (v.length >= 8 && /[a-z]/.test(v) && /[A-Z0-9]/.test(v)) { n = 2; }
        if (v.length >= 10 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)) { n = 3; }
        forca.setAttribute('data-n', n);
      });
    }
  }

  // ------------------------------------------------------------ login.html
  function login(email, erros) {
    var papel = papelDaUrl();
    tela('Entrar', 'Bem-vindo de volta! Acesse sua conta.', 'login.html', papel, erros,
      '<form id="form" class="login-form" novalidate>'
      + campo('email', 'E-mail', 'email', 'email', 'maxlength="120" required autocomplete="email" placeholder="voce@email.com"', email)
      + campo('senha', 'Senha', 'password', 'senha', 'required autocomplete="current-password" placeholder="Sua senha"')
      + '<button class="login-go" type="submit"><span>Entrar como ' + h(App.PAPEIS[papel].toLowerCase()) + '</span></button></form>',
      'Ainda não tem conta? <a href="cadastro.html?papel=' + h(papel) + '">Criar conta</a>');

    var form = document.getElementById('form');
    extras(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target;
      var em = f.email.value.trim().toLowerCase(), senha = f.senha.value;
      var u = DB.usuarioPorEmail(em);
      if (!u || !App.conferirSenha(senha, u.senha_hash)) {
        return login(em, ['E-mail ou senha incorretos.']);
      }
      if (u.papel !== papel) {
        return login(em, ['Esta conta é de ' + App.PAPEIS[u.papel].toLowerCase() + '. Use a aba "' + App.PAPEIS[u.papel] + '".']);
      }
      App.entrarComo(u.id, u.email, u.papel);
    });
  }

  // ------------------------------------------------------------ cadastro.html
  function cadastro(email, erros) {
    var papel = papelDaUrl();
    tela('Criar conta', 'Leva menos de um minuto.', 'cadastro.html', papel, erros,
      '<form id="form" class="login-form" novalidate>'
      + campo('email', 'E-mail', 'email', 'email', 'maxlength="120" required autocomplete="email" placeholder="voce@email.com"', email)
      + '<div class="lf"><label for="senha">Senha</label><div class="lc">' + icone('senha')
      + '<input id="senha" type="password" name="senha" minlength="6" required autocomplete="new-password" placeholder="Mínimo de 6 caracteres"></div>'
      + '<div class="forca" id="forca" aria-hidden="true"><i></i><i></i><i></i></div><div class="lm" data-for="senha"></div></div>'
      + campo('senha2', 'Confirmar senha', 'password', 'senha', 'minlength="6" required autocomplete="new-password" placeholder="Repita a senha"')
      + '<button class="login-go" type="submit"><span>Criar conta de ' + h(App.PAPEIS[papel].toLowerCase()) + '</span></button></form>',
      'Já tem conta? <a href="login.html?papel=' + h(papel) + '">Entrar</a>');

    var form = document.getElementById('form');
    extras(form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = e.target, erros = [];
      var em = f.email.value.trim().toLowerCase(), senha = f.senha.value, conf = f.senha2.value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || em.length > 120) { erros.push('Informe um e-mail válido.'); }
      if (senha.length < 6) { erros.push('A senha deve ter pelo menos 6 caracteres.'); }
      if (senha !== conf) { erros.push('As senhas não conferem.'); }
      if (!erros.length) {
        try {
          var id = DB.inserirUsuario({ email: em, senha_hash: App.hashSenha(senha), papel: papel });
          return App.entrarComo(id, em, papel);
        } catch (err) {
          erros.push(err.code === 'DUP' ? 'Este e-mail já está cadastrado.' : 'Erro ao criar a conta.');
        }
      }
      cadastro(em, erros);
    });
  }

  window.Paginas = window.Paginas || {};
  window.Paginas.login = function () { App.iniciar(function () { login(''); }); };
  window.Paginas.cadastro = function () { App.iniciar(function () { cadastro(''); }); };
})();
