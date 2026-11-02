# Biblioteca Virtual

Sistema de gerenciamento de biblioteca feito em **HTML, CSS e JavaScript puro**, sem PHP e sem servidor.
Projeto da disciplina WEB (Técnico em Análise e Desenvolvimento de Sistemas, IFB).

## Como usar

Abra o site publicado no GitHub Pages e entre com uma conta de demonstração:

| Perfil  | E-mail            | Senha  |
|---------|-------------------|--------|
| Autor   | autor@demo.com    | 123456 |
| Usuário | leitor@demo.com   | 123456 |

- **Autor:** vê o painel e cadastra livros, autores e exemplares.
- **Usuário:** consulta o catálogo, favorita livros e autores e acessa a área de estudos.

Também é possível criar uma conta nova pela tela de cadastro.

## Estrutura

```
index.html          página inicial com os acessos de demonstração
login.html, cadastro.html
painel.html         painel do autor
catalogo.html, estudos.html, favoritos.html, autores_lista.html
autores.html, autor_form.html, livros.html, livro_form.html, livro.html
assets/
  style.css         estilos (temas escuro, claro e suave)
  js/               db.js (banco simulado), app.js, auth.js, admin.js, catalogo.js, livro.js, data.js, capas.js
  uploads/          capas dos livros e fotos dos autores
```

## Sobre os dados

Não existe banco de dados de verdade. Os dados iniciais ficam em `assets/js/data.js` e as alterações
(novos livros, favoritos, contas) são salvas no `localStorage` do navegador, na chave `biblioteca_db_v1`.
Por isso, cada navegador tem a sua própria cópia dos dados.

## Publicar no GitHub Pages

Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)`.
O site fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.
