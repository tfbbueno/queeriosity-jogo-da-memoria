# 🌈 QUEERiosity - Jogo da Memória Queer

QUEERiosity é um jogo da memória digital que tem como objetivo destacar cientistas LGBTQIA+ e suas contribuições para a ciência, promovendo representatividade e aprendizado. Foi desenvolvido como parte da pesquisa do professor [Ítalo Curvelo dos Anjos](http://lattes.cnpq.br/0140677602667558)

## 📚 Sobre o projeto

Neste jogo, o jogador deve encontrar pares de cartas iguais. A cada par descoberto, informações sobre a pessoa cientista retratada são reveladas, possibilitando a descoberta de trajetórias inspiradoras de pessoas LGBTQIA+ na ciência.

## 📂 Estrutura do projeto

```
queeriosity-jogo-memoria/
├── index.html
├── about.html
├── .github/
│   └── workflows
│       └── deploy.yml
├── js/
│   └── firebaseConfig.js
│   └── includes.js
│   └── memory-game.js
├── partials/
│   ├── navbar.html
│   └── footer.html 
├── files/
│   └── ícones, imagens de fundo 
└── style.css
```
### Banco de dados
Este projeto usa o Firestone Firebase. Para publicar como Github Pages é preciso salvar as chaves em Secrets em `Settings ▸ Secrets and variables ▸ Actions ▸ New repository secret`:
- FIREBASE_API_KEY
- FIREBASE_AUTH_DOMAIN
- FIREBASE_PROJECT_ID 
- FIREBASE_STORAGE_BUCKET
- FIREBASE_MESSAGING_SENDER_ID
- FIREBASE_APP_ID 

## ✨ Créditos

As informações e imagens dos cientistas foram obtidas com fins educacionais e de valorização da diversidade. Caso você identifique alguma informação imprecisa ou deseje sugerir novos nomes para o jogo, contribuições são bem-vindas!
 
O projeto foi desenvolvido por [Thais Silva](http://lattes.cnpq.br/2604622781801382) como parte da pesquisa desenvolvida pelo professor [Ítalo Curvelo dos Anjos](http://lattes.cnpq.br/0140677602667558).
 
O projeto foi desenvolvido com HTML, CSS (Bootstrap 5) e JavaScript, com base na lógica de jogo da memória desenvolvido pelo [Diego Pinho](https://github.com/Professor-DiegoPinho/jogo-da-memoria).

Os ícones foram usados do [IconFinder](iconfinder.com).


## 🧑‍💻 Contribuindo

1. Fork este repositório
2. Crie uma branch com sua feature 
3. Commit suas mudanças 
4. Push para a branch 
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a [Licença Creative Commons Atribuição-NãoComercial-CompartilhaIgual 4.0 Internacional](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.pt-br).

Você é livre para:
- Compartilhar — copiar e redistribuir o material em qualquer meio ou formato
- Adaptar — remixar, transformar e criar a partir do material

Desde que:
- **Atribuição** — dê o crédito apropriado, forneça um link para a licença e indique se mudanças foram feitas.
- **NãoComercial** — você não pode usar o material para fins comerciais.
- **CompartilhaIgual** — se remixar, transformar ou criar a partir do material, deve distribuir suas contribuições sob a mesma licença que o original.

## 🌈 Apoie e compartilhe

Se você gostou do projeto, compartilhe com outras pessoas, contribua com feedbacks e ajude a promover representatividade na ciência! 💜
