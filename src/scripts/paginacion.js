function initPagination() {
    const cards = document.querySelectorAll(".benefit-card");
    const paginationContainer = document.getElementById("pagination-container");
    
    if (!paginationContainer || cards.length === 0) return;

    const itemsPerPage = 6;
    const totalPages = Math.ceil(cards.length / itemsPerPage);
    
    function showPage(page) {
        cards.forEach((card, index) => {
            if (index >= (page - 1) * itemsPerPage && index < page * itemsPerPage) {
                card.style.display = "flex";
            } else {
                card.style.display = "none";
            }
        });
        
        const buttons = paginationContainer.querySelectorAll(".page-num");
        buttons.forEach(btn => btn.classList.remove("active"));
        if (buttons[page - 1]) {
            buttons[page - 1].classList.add("active");
        }
    }
    
    if (totalPages > 1) {
        paginationContainer.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("a");
            btn.href = "#";
            btn.className = `page-num ${i === 1 ? 'active' : ''}`;
            btn.textContent = i;
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                showPage(i);
                const title = document.querySelector(".search-filter-title");
                if (title) {
                    title.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
            paginationContainer.appendChild(btn);
        }
        showPage(1);
    } else {
        showPage(1);
        paginationContainer.style.display = "none";
    }
}

// En Astro, los scripts se cargan como tipo módulo y son 'defer', 
// por lo que el DOM ya estará listo cuando esto se ejecute.
initPagination();
