function loadComponent(id, file) {
    fetch(file)
      .then(res => {
        if (!res.ok) throw new Error(`Erro ao carregar ${file}`);
        return res.text();
      })
      .then(html => document.getElementById(id).innerHTML = html)
      .catch(err => console.error(err));
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    loadComponent("navbar", "partials/navbar.html");
    loadComponent("footer", "partials/footer.html");
  });
  