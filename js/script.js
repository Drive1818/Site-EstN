// JavaScript Document

        // ===== Utilities =====
        const fmtBRL = (n) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(n);
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

        // ===== Mobile menu =====
        const btnHamburger = document.getElementById('btnHamburger');
        const mobileNav = document.getElementById('mobileNav');
        btnHamburger?.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            btnHamburger.setAttribute('aria-expanded', mobileNav.classList.contains('open') ? 'true' : 'false');
        });
        mobileNav?.addEventListener('click', (e) => {
            const a = e.target.closest('[data-close-mobile]');
            if(a){
                mobileNav.classList.remove('open');
                btnHamburger?.setAttribute('aria-expanded', 'false');
            }
        });

        window.addEventListener('scroll', () => {
            if(mobileNav.classList.contains('open')) mobileNav.classList.remove('open');
        }, { passive:true });

        // ===== IntersectionObserver reveal =====
        const ioEls = document.querySelectorAll('.io');
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(en => {
                if(en.isIntersecting){
                    en.target.classList.add('in');
                    obs.unobserve(en.target);
                }
            });
        }, { threshold: 0.12 });
        ioEls.forEach(el => obs.observe(el));

        // ===== Dialog helpers =====
        function openDialog(id){
            const d = document.getElementById(id);
            if(!d) return;
            if(typeof d.showModal === 'function') d.showModal();
            else d.setAttribute('open','');
        }
        function closeDialog(id){
            const d = document.getElementById(id);
            if(!d) return;
            if(typeof d.close === 'function') d.close();
            else d.removeAttribute('open');
        }
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-close-dialog]');
            if(btn){
                closeDialog(btn.getAttribute('data-close-dialog'));
            }
        });

        // ===== Cart Drawer =====
        const overlay = document.getElementById('overlay');
        const cartDrawer = document.getElementById('cartDrawer');
        const btnCart = document.getElementById('btnCart');
        const btnCloseCart = document.getElementById('btnCloseCart');

        function openCart(){
            cartDrawer.classList.add('open');
            overlay.classList.add('open');
            overlay.setAttribute('aria-hidden','false');
            document.body.style.overflow = 'hidden';
        }
        function closeCart(){
            cartDrawer.classList.remove('open');
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden','true');
            document.body.style.overflow = '';
        }

        btnCart.addEventListener('click', openCart);
        btnCloseCart.addEventListener('click', closeCart);
        overlay.addEventListener('click', () => {
            closeCart();
            mobileNav.classList.remove('open');
        });

        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape'){
                closeCart();
            }
        });

        // ===== Product data =====
        const productEls = [...document.querySelectorAll('.product')];
        const products = productEls.map((el, idx) => ({
            id: 'p' + (idx+1),
            name: el.dataset.name,
            tags: el.dataset.tags,
            price: Number(el.dataset.price),
            el
        }));

        // ===== Cart state =====
        const CART_KEY = 'sv_cart_v1';
        let cart = loadCart();

        function loadCart(){
            try{
                const raw = localStorage.getItem(CART_KEY);
                if(!raw) return {};
                const parsed = JSON.parse(raw);
                return parsed && typeof parsed === 'object' ? parsed : {};
            }catch{ return {}; }
        }
        function saveCart(){
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        }
        function cartCount(){
            return Object.values(cart).reduce((acc, it) => acc + it.qty, 0);
        }
        function cartTotal(){
            return Object.values(cart).reduce((acc, it) => acc + (it.price * it.qty), 0);
        }

        const cartCountEl = document.getElementById('cartCount');
        const cartTotalEl = document.getElementById('cartTotal');
        const cartItemsEl = document.getElementById('cartItems');
        const btnClearCart = document.getElementById('btnClearCart');
        const btnWhatsApp = document.getElementById('btnWhatsApp');

        function renderCart(){
            cartCountEl.textContent = String(cartCount());
            cartTotalEl.textContent = fmtBRL(cartTotal());

            const items = Object.values(cart);
            if(items.length === 0){
                cartItemsEl.innerHTML = `
                    <div class="cart-empty">
                        Seu carrinho está vazio.<br>
                        Dica: clique em <strong>Comprar</strong> em algum modelo de site.
                    </div>
                `;
                return;
            }

            cartItemsEl.innerHTML = items.map(it => `
                <div class="cart-item" data-id="${it.id}">
                    <div class="mini" aria-hidden="true"></div>
                    <div>
                        <p class="ci-title">${escapeHtml(it.name)}</p>
                        <p class="ci-sub">${fmtBRL(it.price)} • Subtotal: <strong>${fmtBRL(it.price * it.qty)}</strong></p>
                    </div>
                    <div class="ci-right">
                        <div class="qty" aria-label="Quantidade">
                            <button type="button" data-dec aria-label="Diminuir">−</button>
                            <span aria-label="Quantidade atual">${it.qty}</span>
                            <button type="button" data-inc aria-label="Aumentar">+</button>
                        </div>
                        <button class="remove" type="button" data-remove>Remover</button>
                    </div>
                </div>
            `).join('');
        }

        function addToCart(productId){
            const p = products.find(x => x.id === productId);
            if(!p) return;
            cart[productId] = cart[productId] || { id: p.id, name: p.name, price: p.price, qty: 0 };
            cart[productId].qty = clamp(cart[productId].qty + 1, 1, 99);
            saveCart();
            renderCart();
        }

        function setQty(productId, qty){
            if(!cart[productId]) return;
            const q = clamp(qty, 0, 99);
            if(q === 0) delete cart[productId];
            else cart[productId].qty = q;
            saveCart();
            renderCart();
        }

        btnClearCart.addEventListener('click', () => {
            cart = {};
            saveCart();
            renderCart();
        });

        cartItemsEl.addEventListener('click', (e) => {
            const row = e.target.closest('.cart-item');
            if(!row) return;
            const id = row.dataset.id;
            if(e.target.closest('[data-inc]')) setQty(id, (cart[id]?.qty || 0) + 1);
            if(e.target.closest('[data-dec]')) setQty(id, (cart[id]?.qty || 0) - 1);
            if(e.target.closest('[data-remove]')) setQty(id, 0);
        });

        // ===== WhatsApp Integration =====
        function buildWhatsAppMessage(){
            const items = Object.values(cart);
            if(items.length === 0) return null;

            let msg = `*Olá! Gostaria de fazer um pedido.*\n\n`;
            msg += `*Produtos selecionados:*\n\n`;

            items.forEach(it => {
                const subtotal = it.price * it.qty;
                msg += `• ${escapeHtml(it.name)}\n`;
                msg += `  Quantidade: ${it.qty}\n`;
                msg += `  Preço unitário: ${fmtBRL(it.price)}\n`;
                msg += `  Subtotal: ${fmtBRL(subtotal)}\n\n`;
            });

            const total = cartTotal();
            msg += `*TOTAL DA COMPRA: ${fmtBRL(total)}*\n\n`;
            msg += `Obrigado!`;

            return msg;
        }

        function sendWhatsApp(){
            if(cartCount() === 0){
                searchMeta.textContent = 'Adicione pelo menos um produto ao carrinho.';
                return;
            }

            const msg = buildWhatsAppMessage();
            const encoded = encodeURIComponent(msg);
            const whatsappPhone = '5511998600915'; // Altere para o número correto
            const whatsappURL = `https://wa.me/${whatsappPhone}?text=${encoded}`;

            window.open(whatsappURL, '_blank');
        }

        btnWhatsApp.addEventListener('click', sendWhatsApp);

        // Bind buy buttons + preview
        document.addEventListener('click', (e) => {
            const addBtn = e.target.closest('[data-add]');
            if(addBtn){
                const card = e.target.closest('.product');
                const p = products.find(x => x.el === card);
                if(p){
                    addToCart(p.id);
                    openCart();
                }
            }
            const prevBtn = e.target.closest('[data-preview]');
            if(prevBtn){
                const card = e.target.closest('.product');
                const p = products.find(x => x.el === card);
                if(p) openDetails(p);
            }
        });

        // ===== Search: filter + highlight + scroll to results =====
        const searchInput = document.getElementById('searchInput');
        const btnSearch = document.getElementById('btnSearch');
        const searchMeta = document.getElementById('searchMeta');

        function normalize(s){
            return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
        }

        function applySearch(query){
            const q = normalize(query.trim());
            let shown = 0;

            productEls.forEach(el => {
                el.style.outline = 'none';
                el.style.boxShadow = '';
            });

            products.forEach(p => {
                const hay = normalize(p.name + ' ' + p.tags);
                const match = q === '' ? true : hay.includes(q);
                p.el.style.display = match ? '' : 'none';
                if(match) shown++;
            });

            if(q){
                searchMeta.textContent = `Resultado para "${query}": ${shown} item(ns) encontrado(s).`;
            }else{
                searchMeta.textContent = `Mostrando todos os modelos: ${shown} item(ns).`;
            }

            const first = products.find(p => p.el.style.display !== 'none');
            if(first && q){
                first.el.scrollIntoView({ behavior:'smooth', block:'center' });
                first.el.style.outline = '2px solid rgba(34,197,94,.55)';
                first.el.style.boxShadow = '0 26px 70px rgba(0,0,0,.35), 0 0 0 6px rgba(34,197,94,.10)';
            }
        }

        btnSearch.addEventListener('click', () => applySearch(searchInput.value));
        searchInput.addEventListener('keydown', (e) => {
            if(e.key === 'Enter') applySearch(searchInput.value);
        });
        searchInput.addEventListener('input', () => applySearch(searchInput.value));

        // ===== Login popup =====
        const btnLogin = document.getElementById('btnLogin');
        const loginDialog = document.getElementById('loginDialog');
        const loginForm = document.getElementById('loginForm');
        let isLogged = false;

        btnLogin.addEventListener('click', () => openDialog('loginDialog'));
        document.getElementById('btnLoginFromHow').addEventListener('click', () => openDialog('loginDialog'));

        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            isLogged = true;
            btnLogin.textContent = 'Minha conta';
            closeDialog('loginDialog');
            searchMeta.textContent = 'Login realizado (simulação). Você já pode finalizar no checkout.';
        });

        // ===== Checkout popup =====
        const btnCheckout = document.getElementById('btnCheckout');
        const checkoutDialog = document.getElementById('checkoutDialog');
        const checkoutSummary = document.getElementById('checkoutSummary');
        const checkoutTotalEl = document.getElementById('checkoutTotal');
        const btnConfirmPay = document.getElementById('btnConfirmPay');
        const checkoutMsg = document.getElementById('checkoutMsg');
        const cardFields = document.getElementById('cardFields');

        function getPayMethod(){
            const checked = checkoutDialog.querySelector('input[name="pay"]:checked');
            return checked ? checked.value : 'pix';
        }

        function calcCheckoutTotal(){
            const base = cartTotal();
            const method = getPayMethod();
            if(method === 'pix') return Math.max(0, base * 0.97);
            return base;
        }

        function renderCheckout(){
            const items = Object.values(cart);
            if(items.length === 0){
                checkoutSummary.innerHTML = `
                    <div class="sum-row">
                        <div><strong>Nenhum item no carrinho</strong><small>Volte e adicione um modelo.</small></div>
                        <div><strong>${fmtBRL(0)}</strong></div>
                    </div>
                `;
            }else{
                checkoutSummary.innerHTML = items.map(it => `
                    <div class="sum-row">
                        <div>
                            <strong>${escapeHtml(it.name)}</strong>
                            <small>${it.qty} × ${fmtBRL(it.price)}</small>
                        </div>
                        <div><strong>${fmtBRL(it.qty * it.price)}</strong></div>
                    </div>
                `).join('');
            }

            const method = getPayMethod();
            cardFields.style.display = (method === 'card') ? 'block' : 'none';

            const total = calcCheckoutTotal();
            checkoutTotalEl.textContent = fmtBRL(total);

            if(method === 'pix'){
                checkoutMsg.textContent = 'Pix selecionado: desconto demo de 3% aplicado.';
            }else if(method === 'boleto'){
                checkoutMsg.textContent = 'Boleto selecionado: compensação em até 2 dias úteis (simulação).';
            }else{
                checkoutMsg.textContent = 'Cartão selecionado: preencha os campos (dados fictícios) e confirme.';
            }
        }

        function openCheckout(){
            if(cartCount() === 0){
                openCart();
                searchMeta.textContent = 'Adicione pelo menos um produto ao carrinho para abrir o checkout.';
                return;
            }
            if(!isLogged){
                openDialog('loginDialog');
                searchMeta.textContent = 'Faça login (simulação) para continuar ao checkout.';
                return;
            }
            closeCart();
            openDialog('checkoutDialog');
            renderCheckout();
        }

        btnCheckout.addEventListener('click', openCheckout);
        document.getElementById('btnOpenCheckoutFromHero').addEventListener('click', openCheckout);

        checkoutDialog.addEventListener('change', (e) => {
            if(e.target && e.target.name === 'pay') renderCheckout();
        });

        btnConfirmPay.addEventListener('click', () => {
            const method = getPayMethod();
            if(cartCount() === 0) return;

            if(method === 'card'){
                const name = document.getElementById('cardName').value.trim();
                const num = document.getElementById('cardNum').value.replace(/\s/g,'').trim();
                const exp = document.getElementById('cardExp').value.trim();
                const cvv = document.getElementById('cardCvv').value.trim();
                if(!name || num.length < 13 || exp.length < 4 || cvv.length < 3){
                    checkoutMsg.textContent = 'Verifique os dados do cartão (simulação) e tente novamente.';
                    checkoutMsg.style.color = 'rgba(239,68,68,.92)';
                    return;
                }
            }

            checkoutMsg.style.color = 'rgba(34,197,94,.92)';
            checkoutMsg.textContent = `Pagamento confirmado via ${method.toUpperCase()} (simulação). Pedido finalizado!`;

            cart = {};
            saveCart();
            renderCart();

            setTimeout(() => {
                closeDialog('checkoutDialog');
                checkoutMsg.style.color = 'rgba(255,255,255,.75)';
                checkoutMsg.textContent = '';
                searchMeta.textContent = 'Pedido finalizado (simulação). Você pode escolher outro modelo.';
            }, 900);
        });

        // ===== Details modal =====
        const detailsTitle = document.getElementById('detailsTitle');
        const detailsSub = document.getElementById('detailsSub');
        const detailsBody = document.getElementById('detailsBody');

        function openDetails(p){
            detailsTitle.textContent = p.name;
            detailsSub.textContent = `Preço: ${fmtBRL(p.price)} • Tags: ${p.tags}`;
            detailsBody.innerHTML = `
                <div style="display:grid; grid-template-columns: 1fr; gap: 12px;">
                    <div style="border-radius: 18px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06); padding: 14px; line-height: 1.6; color: rgba(255,255,255,.78);">
                        <strong style="color: rgba(255,255,255,.92);">O que você recebe</strong>
                        <ul style="margin: 8px 0 0; padding-left: 18px;">
                            <li>Layout responsivo e moderno</li>
                            <li>Seções essenciais + CTA</li>
                            <li>Estrutura pronta para SEO básico</li>
                            <li>Integração com carrinho/checkout (demo)</li>
                        </ul>
                    </div>

                    <div style="display:flex; gap: 10px; justify-content:flex-end; flex-wrap:wrap;">
                        <button class="btn" type="button" data-close-dialog="detailsDialog">Fechar</button>
                        <button class="btn btn-primary" type="button" id="detailsBuy">Adicionar ao carrinho</button>
                    </div>
                </div>
            `;
            openDialog('detailsDialog');

            const detailsBuy = document.getElementById('detailsBuy');
            detailsBuy.addEventListener('click', () => {
                addToCart(p.id);
                closeDialog('detailsDialog');
                openCart();
            }, { once:true });
        }

        document.getElementById('btnOpenCartFromHow').addEventListener('click', openCart);

        document.getElementById('cardNum').addEventListener('input', (e) => {
            const v = e.target.value.replace(/\D/g,'').slice(0,16);
            e.target.value = v.replace(/(.{4})/g,'$1 ').trim();
        });
        document.getElementById('cardExp').addEventListener('input', (e) => {
            const v = e.target.value.replace(/\D/g,'').slice(0,4);
            e.target.value = v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v;
        });
        document.getElementById('cardCvv').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g,'').slice(0,4);
        });

        function escapeHtml(str){
            return String(str)
                .replaceAll('&','&amp;')
                .replaceAll('<','&lt;')
                .replaceAll('>','&gt;')
                .replaceAll('"','&quot;')
                .replaceAll("'",'&#039;');
        }

        renderCart();
        applySearch('');


 //=========================Script=================
     //---------------img Modal inicio-------------

function openModal(modalId, caption) {
  let modal = document.getElementById(modalId);
  modal.style.display = "flex";
  modal.classList.add("show");
  let message = modal.querySelector(".caption");
  message.innerText = caption;
}

function closeModal(modalId) {
  let modal = document.getElementById(modalId);
  modal.classList.remove("show");
  setTimeout(function () {
    modal.style.display = "none";
    modal.querySelector(".caption").innerText = "";
  }, 300);
}

//---------------img Modal final-------------

    