/* capas.js — liga cada livro/autor à sua imagem na pasta uploads/.
   No PHP essa ligação ficava na coluna `capa` do MySQL; aqui ela é feita por ID.
   Para trocar/adicionar: escreva  id: 'arquivo.jpg'  e salve. Capas enviadas pelo próprio site
   (formulário de livro/autor) têm prioridade e não são alteradas por este arquivo. */
window.CAPAS = {
  livros: {
    1: 'adbbe68aed40cb2e.jpg',
    2: '7354ef65cce9138b.jpg',
    3: '2c6dba37d9b927dd.jpg',
    4: '2a810185fc360e2b.jpg',
    5: '192d11fcb9c0a978.jpg',
    6: '949b3b8d354e35ec.jpg',
    7: '6a079fe712323158.jpg',
    8: '3916388a57f3c298.jpg',
    9: '06b7fd0489cb2246.jpg',
    10: 'b21164c6c7d87aac.jpg',
    11: '36ea3cc144973751.jpg',
    12: 'b2268129cb64dd61.jpg',
    13: 'e2b6d9a89fdd6d7d.jpg',
    14: '71ad791bfc79f1f0.jpg',
    15: '1fed66b6057c59da.jpg',
    16: '433bea4d71edbca4.jpg',
    17: '2fde2305118318cb.jpg',
    18: 'f2b9ef42338cf96d.jpg',
    19: '31d2b8ac9aaec31e.jpg',
    20: '710ec7e29c2ff067.jpg',
    21: '8c6c800fbe77a5a0.jpg',
    22: 'fe4d9bfd7ab1f650.jpg',
    23: '4052b85d9ddedb81.jpg',
    24: '32fb92fc741b9459.jpg',
    25: '1b2c94cdbd3572c6.jpg',
    26: '62d478299ecbedbf.jpg',
    27: '3814d12de4ddb8a6.jpg',
    28: '365ca27f8877e8e7.jpg',
    29: '99249befc536c1a0.jpg',
    30: 'a5ac8a1f3fb81507.jpg',
    31: 'c33b60ac76a69d2b.jpg',
    32: '05ded4161c30a906.jpg',
    33: '854c7edac5dd8c6f.jpg',
    34: '5ef7ab83abd77f32.jpg',
    35: 'b9e035f5217fb9bf.jpg',
    36: 'a9a417942c5ffa9f.jpg',
    37: '207c0d2aafd75c1a.jpg',
    38: '9f0d4eea43bf7586.jpg',
    39: '32fcfd60dfb5ca12.jpg',
    40: '5dab75fd51f4f64b.jpg'
  },
  autores: {
    // nenhuma foto de uploads/ corresponde a autores dos arquivos .sql (veja a lista abaixo)
  }
};

/* Imagens de uploads/ SEM registro correspondente nos arquivos .sql (por isso não aparecem no site).
   Se o livro/autor for cadastrado, ponha o ID acima.

   Capas de livros que não estão no .sql:
   //  221e62d6571ad97c.jpg  capa de "O Vilarejo"
   //  35fd443fd0c31ef3.webp  capa de "O Grande Mentecapto"
   //  3a2854f8fe5c0553.jpg  capa de "O Pequeno Príncipe"
   //  58b18e5c9f5802dc.jpg  capa de "Tudo é Rio"
   //  5afe9a8ee4f8aa25.jpg  capa de "A Hipótese do Amor"
   //  7ef412dd221fed5c.jpg  capa de "Dexter: A Mão Esquerda de Deus"
   //  865853f9b7dd50b7.jpg  capa de "Percy Jackson e o Ladrão de Raios"
   //  9e326a7ffa1d520a.jpg  capa de "Jurassic Park"
   //  a0e8a2344036f585.jpg  capa de "Os Sete Maridos de Evelyn Hugo"
   //  a37b879a7cfe84e8.jpg  capa de "Verity"
   //  accfa57d4d4d9bee.jpg  capa de "Primeiro Sangue"
   //  b22eff9cd30ae91b.jpg  capa de "O Exorcista"
   //  b9786c5cbff91dc0.jpg  capa de "Devoradores de Estrelas"
   //  c280e892b7253b4b.jpg  capa de "A Identidade Bourne"
   //  f6f3e5c18d7bbd24.jpg  capa de "Segredos da Comédia Stand-Up"
   //  f8de1de2fb3ded71.jpg  capa de "A Guerra da Papoula"

   Fotos de pessoas (autores que não estão no .sql):
   //  177282fea45bf562.webp
   //  4d77459c977235b7.webp
   //  548cc6e1ed78446a.jpg
   //  5d91cb986b611749.jpg
   //  61a89e6648795d34.webp
   //  902c6d94a41b3849.webp
   //  925a59c091f40367.webp
   //  a245a62286c54afe.jpg
   //  a7dbb2873685db73.webp
   //  ab7f3b057617535a.jpg
   //  b66b88334341f3bd.jpg
   //  c644ae56733e32ac.jpg
   //  d6c6eee2e9165dfc.jpg
   //  e587edc0a4c1db84.webp
*/
