/* ============================================
   CONTROL DE ORADORES PRO - APP LOGIC
   ============================================ */

const app = {
    // --- Data Store ---
    db: {
        congregaciones: JSON.parse(localStorage.getItem('congregaciones')) || {},
        bosquejos: JSON.parse(localStorage.getItem('bosquejos')) || {},
        visitantes: JSON.parse(localStorage.getItem('visitantes')) || {},
        salientes: JSON.parse(localStorage.getItem('salientes')) || {},
        arreglos: JSON.parse(localStorage.getItem('arreglos')) || [],
        config: JSON.parse(localStorage.getItem('config')) || {
            nombre: '', nro: '', direccion: '', horario: '', celular: '', responsable: '', email: '', dias: ''
        }
    },
    currentPin: '',
    correctPin: '1234', // Default PIN for demo
    currentOradoresType: 'visitantes',

    // --- Core Methods ---
    init() {
        console.log("Control de Oradores Pro - Initialized");
        this.renderLists();
        this.renderStats();
        this.renderRecentActivity();
        this.setupEventListeners();
        this.updateDataLists();
        this.updateArreglosFlow();
    },

    save() {
        localStorage.setItem('congregaciones', JSON.stringify(this.db.congregaciones));
        localStorage.setItem('bosquejos', JSON.stringify(this.db.bosquejos));
        localStorage.setItem('visitantes', JSON.stringify(this.db.visitantes));
        localStorage.setItem('salientes', JSON.stringify(this.db.salientes));
        localStorage.setItem('arreglos', JSON.stringify(this.db.arreglos));
        localStorage.setItem('config', JSON.stringify(this.db.config));
    },

    navigate(screenId) {
        if (screenId !== 'login' && this.currentPin !== this.correctPin) return;

        // Toggle screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const target = document.getElementById('screen-' + screenId);
        if (target) target.classList.add('active');

        // Toggle nav icons
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const nav = document.getElementById('nav-' + screenId);
        if (nav) nav.classList.add('active');

        // Refresh icons just in case
        lucide.createIcons();

        // Specific screen init
        if (screenId === 'settings') this.loadConfigToUI();
    },

    loadConfigToUI() {
        if (!this.db.config) return;
        document.getElementById('cfg-cong-nombre').value = this.db.config.nombre || '';
        document.getElementById('cfg-cong-nro').value = this.db.config.nro || '';
        document.getElementById('cfg-direccion').value = this.db.config.direccion || '';
        document.getElementById('cfg-dias').value = this.db.config.dias || '';
        document.getElementById('cfg-horario').value = this.db.config.horario || '';
        document.getElementById('cfg-celular').value = this.db.config.celular || '';
        document.getElementById('cfg-responsable').value = this.db.config.responsable || '';
        document.getElementById('cfg-email').value = this.db.config.email || '';
    },

    // --- UI Rendering ---
    renderLists() {
        // Render Congregaciones with search
        const congQuery = document.getElementById('search-cong')?.value?.toLowerCase() || '';
        const congList = document.getElementById('list-congregaciones');
        if (congList) {
            congList.innerHTML = '';
            Object.entries(this.db.congregaciones)
                .filter(([id, data]) => {
                    const name = typeof data === 'string' ? data : data.name || data.nombre;
                    return name.toLowerCase().includes(congQuery) || id.includes(congQuery);
                })
                .forEach(([id, data]) => {
                    const name = typeof data === 'string' ? data : data.nombre;
                    congList.innerHTML += `
                        <div class="glass-card" style="padding: 12px 16px; margin-bottom: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                <div>
                                    <span style="color: var(--primary); font-weight: 700; margin-right: 10px;">${id}</span>
                                    <span style="font-weight: 700;">${name}</span>
                                </div>
                                <div style="display: flex; gap: 10px;">
                                    <button onclick="app.startEditCong('${id}')" style="background:none; border:none; color: var(--primary);">
                                        <i data-lucide="edit-3" style="width: 16px;"></i>
                                    </button>
                                    <button onclick="app.removeItem('congregaciones', '${id}')" style="background:none; border:none; color: var(--text-muted);">
                                        <i data-lucide="trash-2" style="width: 16px;"></i>
                                    </button>
                                </div>
                            </div>
                            ${typeof data === 'object' ? `
                                <div style="font-size: 0.75rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 5px;">
                                    <div>Dir: ${data.direccion || '-'}</div>
                                    <div>Día: ${data.dia || '-'} ${data.hora || '-'}</div>
                                    <div>Resp: ${data.responsable || '-'}</div>
                                    <div>Tel: ${data.contacto || '-'}</div>
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
        }

        // Render Bosquejos with search
        const bosqQuery = document.getElementById('search-bosq')?.value?.toLowerCase() || '';
        const bosqList = document.getElementById('list-bosquejos');
        if (bosqList) {
            bosqList.innerHTML = '';
            Object.entries(this.db.bosquejos)
                .filter(([id, title]) => title.toLowerCase().includes(bosqQuery) || id.includes(bosqQuery))
                .forEach(([id, title]) => {
                    bosqList.innerHTML += `
                        <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px;">
                            <div style="flex: 1;">
                                <span style="color: var(--secondary); font-weight: 700; margin-right: 10px;">#${id}</span>
                                <span>${title}</span>
                            </div>
                            <button onclick="app.removeItem('bosquejos', '${id}')" style="background:none; border:none; color: var(--text-muted);">
                                <i data-lucide="trash-2" style="width: 16px;"></i>
                            </button>
                        </div>
                    `;
                });
        }

        lucide.createIcons();
        this.updateDataLists();
        this.renderStats();
    },

    setOradoresFilter(tipo) {
        this.currentOradoresType = tipo;
        
        // Update chips UI
        const chips = {
            visitantes: document.getElementById('chip-visitantes'),
            salientes: document.getElementById('chip-salientes')
        };
        
        Object.entries(chips).forEach(([k, el]) => {
            if (el) {
                if (k === tipo) {
                    el.style.background = 'var(--primary)';
                    el.style.color = 'white';
                    el.style.boxShadow = '0 4px 12px var(--primary-glow)';
                } else {
                    el.style.background = 'var(--surface-light)';
                    el.style.color = 'var(--text-muted)';
                    el.style.boxShadow = 'none';
                }
            }
        });

        this.renderOradores();
    },

    renderOradores() {
        const tipo = this.currentOradoresType;
        const list = document.getElementById('items-oradores');
        const query = document.getElementById('search-ora')?.value?.toLowerCase() || '';
        
        if (!list) return;
        list.innerHTML = '';
        
        const data = this.db[tipo] || {};
        Object.entries(data)
            .filter(([nombre, info]) => nombre.toLowerCase().includes(query) || info.nro_cong.toLowerCase().includes(query))
            .forEach(([nombre, info]) => {
                const bosqCount = (info.bosquejos || []).length;
                list.innerHTML += `
                    <div class="glass-card fade-in" style="margin-bottom:8px; position:relative; padding: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                            <div>
                                <div style="font-weight:700;">${nombre}</div>
                                <div style="font-size:0.8rem; color:var(--text-muted);">
                                    Congregación: <span style="color:var(--primary);">${info.nro_cong}</span>
                                </div>
                                <div style="font-size:0.7rem; color:var(--text-dim); margin-top: 5px;">
                                    Bosquejos vinculados: <span style="color: var(--secondary); font-weight: 700;">${bosqCount}</span>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button onclick="app.startEditOra('${tipo}', '${nombre}')" style="background:none; border:none; color: var(--primary);">
                                    <i data-lucide="user-cog" style="width: 18px;"></i>
                                </button>
                                <button onclick="app.removeItem('${tipo}', '${nombre}')" style="background:none; border:none; color:var(--text-dim);">
                                    <i data-lucide="trash" style="width: 18px;"></i>
                                </button>
                            </div>
                        </div>

                        ${this.db.editingOra && this.db.editingOra.nombre === nombre ? `
                            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--glass-border);">
                                <div style="font-size: 0.75rem; font-weight: 700; color: var(--secondary); margin-bottom: 10px; text-transform: uppercase;">Temas del Orador</div>
                                <div style="display: flex; gap: 8px; margin-bottom: 15px;">
                                    <select id="ora-bosq-add" style="flex: 1; font-size: 0.75rem;">
                                        <option value="">Seleccionar tema...</option>
                                        ${Object.entries(this.db.bosquejos).map(([id, t]) => `<option value="${id}">${id} - ${t}</option>`).join('')}
                                    </select>
                                    <button onclick="app.addBosquejoToOrador()" class="btn-primary" style="padding: 5px 10px; font-size: 0.7rem;">Añadir</button>
                                </div>
                                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                                    ${(info.bosquejos || []).map((bid, idx) => `
                                        <span class="glass-card" style="padding: 4px 8px; font-size: 0.65rem; display: flex; align-items: center; gap: 5px; background: var(--secondary-glow); color: var(--secondary);">
                                            #${bid}
                                            <i data-lucide="x" onclick="app.removeBosquejoFromOrador(${idx})" style="width: 12px; cursor: pointer;"></i>
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
            });
        lucide.createIcons();
    },

    renderConsultar() {
        const query = document.getElementById('consult-query')?.value?.toLowerCase() || '';
        const list = document.getElementById('consult-results');
        if (!list) return;
        list.innerHTML = '';

        if (!query) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-dim); margin-top: 20px;">Comienza a escribir para buscar oradores o congregaciones.</p>';
            return;
        }

        // Search Speakers
        ['visitantes', 'salientes'].forEach(tipo => {
            Object.entries(this.db[tipo]).forEach(([nombre, info]) => {
                if (nombre.toLowerCase().includes(query) || info.nro_cong.includes(query)) {
                    const cong = this.db.congregaciones[info.nro_cong];
                    const congName = typeof cong === 'string' ? cong : (cong?.nombre || 'Desconocida');
                    list.innerHTML += `
                        <div class="glass-card fade-in" style="border-left: 4px solid var(--primary);">
                            <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--primary); font-weight: 700;">ORADOR ${tipo.toUpperCase()}</div>
                            <div style="font-weight: 700; font-size: 1.1rem; margin: 4px 0;">${nombre}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px;">
                                <i data-lucide="building-2" style="width: 12px; vertical-align: middle;"></i> ${info.nro_cong} - ${congName}
                            </div>
                            <div style="font-size: 0.75rem;">
                                <div style="font-weight: 600; color: var(--secondary); margin-bottom: 5px;">Bosquejos Disponibles:</div>
                                <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                                    ${(info.bosquejos || []).length > 0 ? (info.bosquejos || []).map(bid => `
                                        <span style="background: var(--surface-light); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem;">
                                            #${bid} ${this.db.bosquejos[bid] || ''}
                                        </span>
                                    `).join('') : '<span style="color: var(--text-dim);">Ninguno vinculado</span>'}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        });

        // Search Congregations
        Object.entries(this.db.congregaciones).forEach(([id, data]) => {
            const name = typeof data === 'string' ? data : data.nombre;
            if (name.toLowerCase().includes(query) || id.includes(query)) {
                list.innerHTML += `
                    <div class="glass-card fade-in" style="border-left: 4px solid var(--secondary);">
                        <div style="font-size: 0.6rem; text-transform: uppercase; color: var(--secondary); font-weight: 700;">CONGREGACIÓN</div>
                        <div style="font-weight: 700; font-size: 1.1rem; margin: 4px 0;">${id} - ${name}</div>
                        ${typeof data === 'object' ? `
                            <div style="font-size: 0.8rem; color: var(--text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
                                <div><i data-lucide="map-pin" style="width: 12px;"></i> ${data.direccion || '-'}</div>
                                <div><i data-lucide="clock" style="width: 12px;"></i> ${data.dia || '-'} ${data.hora || '-'}</div>
                                <div><i data-lucide="user" style="width: 12px;"></i> ${data.responsable || '-'}</div>
                                <div><i data-lucide="phone" style="width: 12px;"></i> ${data.contacto || '-'}</div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        });

        lucide.createIcons();
    },

    renderStats() {
        const statsEl = document.getElementById('stats-speakers');
        if (statsEl) {
            const total = Object.keys(this.db.visitantes).length + Object.keys(this.db.salientes).length;
            statsEl.innerText = total;
        }

        // Update Upcoming Arrangement Card (Mock or First valid)
        const nextArrCard = document.querySelector('.status-card p');
        if (nextArrCard && this.db.arreglos.length > 0) {
            const sorted = [...this.db.arreglos].sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
            const future = sorted.find(a => new Date(a.fecha) >= new Date().setHours(0,0,0,0));
            if (future) {
                const d = new Date(future.fecha);
                const options = { weekday: 'long', day: 'numeric', month: 'long' };
                nextArrCard.innerText = `${d.toLocaleDateString('es-ES', options)} - ${future.tipo}`;
            }
        }
    },

    renderRecentActivity() {
        const recentEl = document.getElementById('recent-activity');
        if (!recentEl) return;

        const recent = [...this.db.arreglos].sort((a,b) => b.id - a.id).slice(0, 3);
        
        if (recent.length === 0) {
            recentEl.innerHTML = '<p style="font-size:0.8rem; color:var(--text-dim); text-align:center; padding:10px;">No hay actividad reciente.</p>';
            return;
        }

        recentEl.innerHTML = recent.map(a => `
            <div class="glass-card fade-in" style="padding: 12px; display: flex; align-items: center; gap: 15px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: ${a.tipo === 'Visitante' ? 'var(--secondary-glow)' : 'var(--primary-glow)'}; color: ${a.tipo === 'Visitante' ? 'var(--secondary)' : 'var(--primary)'}; display: flex; align-items: center; justify-content: center;">
                    <i data-lucide="${a.tipo === 'Visitante' ? 'user-plus' : 'user-minus'}" style="width: 20px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.9rem; font-weight: 600;">${a.nombre}</div>
                    <div style="font-size: 0.7rem; color: var(--text-muted);">${a.congregacion}</div>
                </div>
                <div style="text-align: right; font-size: 0.7rem; color: var(--text-dim);">
                    ${a.fecha.split('-').reverse().join('/')}
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    },

    updateDataLists() {
        const oraDatalist = document.getElementById('data-oradores');
        const bosqDatalist = document.getElementById('data-bosquejos');
        const congArrDatalist = document.getElementById('data-cong-arr');
        
        if (congArrDatalist) {
            congArrDatalist.innerHTML = '';
            Object.entries(this.db.congregaciones).forEach(([id, data]) => {
                const name = typeof data === 'string' ? data : data.nombre;
                congArrDatalist.innerHTML += `<option value="${id} - ${name}">`;
            });
        }

        if (bosqDatalist) {
            bosqDatalist.innerHTML = '';
            Object.entries(this.db.bosquejos).forEach(([id, t]) => {
                bosqDatalist.innerHTML += `<option value="${id} - ${t}">`;
            });
        }
    },

    updateArreglosFlow() {
        const tipo = document.getElementById('arr-tipo');
        const cong = document.getElementById('arr-cong');
        const oraList = document.getElementById('data-oradores');

        if (!tipo || !cong) return;

        // Reset inputs when switching type
        tipo.addEventListener('change', () => {
            cong.value = '';
            if (oraList) oraList.innerHTML = ''; 
        });

        cong.addEventListener('input', () => {
            const congId = cong.value.split(' - ')[0];
            if (congId) this.filterOradoresByCong(congId);
        });
    },

    filterOradoresByCong(congId) {
        const tipo = document.getElementById('arr-tipo').value;
        const oraList = document.getElementById('data-oradores');
        if (!oraList) return;

        oraList.innerHTML = '';
        const sourceKey = tipo === 'Saliente' ? 'salientes' : 'visitantes';
        const oradores = this.db[sourceKey];

        Object.entries(oradores).forEach(([nombre, info]) => {
            if (String(info.nro_cong) === String(congId)) {
                oraList.innerHTML += `<option value="${nombre}">`;
            }
        });
    },

    // --- Action Handlers ---
    setupEventListeners() {
        // Save Congregacion
        const btnSaveCong = document.getElementById('btn-save-cong');
        if (btnSaveCong) {
            btnSaveCong.addEventListener('click', () => {
                const id = document.getElementById('cong-nro').value;
                const nom = document.getElementById('cong-nombre').value;
                if (!id || !nom) return alert("Nro y Nombre son obligatorios");

                this.db.congregaciones[id] = {
                    nombre: nom,
                    direccion: document.getElementById('cong-direccion').value,
                    dia: document.getElementById('cong-dia').value,
                    hora: document.getElementById('cong-hora').value,
                    responsable: document.getElementById('cong-responsable').value,
                    contacto: document.getElementById('cong-contacto').value
                };

                // If the ID was changed while editing, delete the old key
                if (this.db.editingCong && this.db.editingCong !== id) {
                    delete this.db.congregaciones[this.db.editingCong];
                }

                this.save();
                this.renderLists();
                
                ['cong-nro', 'cong-nombre', 'cong-direccion', 'cong-dia', 'cong-hora', 'cong-responsable', 'cong-contacto']
                    .forEach(fid => document.getElementById(fid).value = '');
                
                this.db.editingCong = null;
                document.getElementById('btn-cancel-cong').style.display = 'none';
                document.getElementById('btn-save-cong').innerText = 'Guardar Congregación';
            });
        }

        const btnCancelCong = document.getElementById('btn-cancel-cong');
        if (btnCancelCong) {
            btnCancelCong.addEventListener('click', () => {
                this.db.editingCong = null;
                ['cong-nro', 'cong-nombre', 'cong-direccion', 'cong-dia', 'cong-hora', 'cong-responsable', 'cong-contacto']
                    .forEach(fid => document.getElementById(fid).value = '');
                btnCancelCong.style.display = 'none';
                document.getElementById('btn-save-cong').innerText = 'Guardar Congregación';
            });
        }

        // Save Bosquejo
        const btnSaveBosq = document.getElementById('btn-save-bosq');
        if (btnSaveBosq) {
            btnSaveBosq.addEventListener('click', () => {
                const id = document.getElementById('bosq-nro').value;
                const title = document.getElementById('bosq-titulo').value;
                if (!id || !title) return alert("Completa los campos");

                this.db.bosquejos[id] = title;
                this.save();
                this.renderLists();

                document.getElementById('bosq-nro').value = '';
                document.getElementById('bosq-titulo').value = '';
            });
        }

        // Save Orador
        const btnSaveOra = document.getElementById('btn-save-ora');
        if (btnSaveOra) {
            btnSaveOra.addEventListener('click', () => {
                const tipo = document.getElementById('ora-tipo').value;
                const nombre = document.getElementById('ora-nombre').value;
                const nro_cong = document.getElementById('ora-cong-nro').value;
                if (!nombre || !nro_cong) return alert("Completa los campos");

                // Preserve bosquejos if updating
                const oldData = this.db[tipo][nombre];
                
                this.db[tipo][nombre] = { 
                    nro_cong, 
                    bosquejos: oldData?.bosquejos || [] 
                };
                
                // If the name was changed while editing, delete the old key
                if (this.db.editingOra && this.db.editingOra.nombre !== nombre) {
                    delete this.db[this.db.editingOra.tipo][this.db.editingOra.nombre];
                }

                this.save();
                this.renderOradores();
                this.renderStats();
                this.updateDataLists();

                document.getElementById('ora-nombre').value = '';
                document.getElementById('ora-cong-nro').value = '';
                
                this.db.editingOra = null;
                document.getElementById('btn-cancel-ora').style.display = 'none';
                document.getElementById('btn-save-ora').innerText = 'Guardar Orador';
            });
        }

        const btnCancelOra = document.getElementById('btn-cancel-ora');
        if (btnCancelOra) {
            btnCancelOra.addEventListener('click', () => {
                this.db.editingOra = null;
                document.getElementById('ora-nombre').value = '';
                document.getElementById('ora-cong-nro').value = '';
                btnCancelOra.style.display = 'none';
                document.getElementById('btn-save-ora').innerText = 'Guardar Orador';
            });
        }

        // Save Arreglo
        const btnSaveArr = document.getElementById('btn-save-arr');
        if (btnSaveArr) {
            btnSaveArr.addEventListener('click', () => {
                const fecha = document.getElementById('arr-fecha').value;
                const tipo = document.getElementById('arr-tipo').value;
                const nombre = document.getElementById('arr-nombre').value;
                const bosquejo = document.getElementById('arr-bosquejo').value;
                const congRaw = document.getElementById('arr-cong').value;

                if (!fecha || !nombre || !bosquejo || !congRaw) return alert("Completa todos los campos");

                // --- Auto-Learn Logic ---
                // 1. Process Congregation
                const [congId, ...congParts] = congRaw.split(' - ');
                const congName = congParts.join(' - ').trim();
                if (congId && congName) {
                    if (!this.db.congregaciones[congId]) {
                        this.db.congregaciones[congId] = congName;
                    }
                }

                // 2. Process Speaker
                const targetOraKey = tipo === 'Saliente' ? 'salientes' : 'visitantes';
                if (!this.db[targetOraKey][nombre]) {
                    this.db[targetOraKey][nombre] = { nro_cong: congId };
                }

                // 3. Process Outline
                const [bosqId, ...bosqParts] = bosquejo.split(' - ');
                const bosqTitle = bosqParts.join(' - ').trim();
                if (bosqId && bosqTitle) {
                    if (!this.db.bosquejos[bosqId]) {
                        this.db.bosquejos[bosqId] = bosqTitle;
                    }
                }

                // Save to master lists
                const nuevo = { 
                    fecha, 
                    tipo, 
                    nombre, 
                    bosquejo, 
                    congregacion: congRaw,
                    id: Date.now() 
                };
                
                this.db.arreglos.push(nuevo);
                this.save();
                this.renderLists(); // Refresh all other views
                this.renderRecentActivity();
                alert("Arreglo guardado y base de datos actualizada.");
                
                document.getElementById('arr-nombre').value = '';
                document.getElementById('arr-bosquejo').value = '';
                document.getElementById('arr-cong').value = '';
                this.renderArreglos();
            });
        }

        const filterMonth = document.getElementById('filter-month');
        if (filterMonth) {
            filterMonth.addEventListener('change', () => this.renderArreglos());
        }

        // Excel Imports
        const excelCong = document.getElementById('excel-cong');
        if (excelCong) {
            excelCong.addEventListener('change', (e) => this.importExcel(e, 'congregaciones', ['Nro', 'Nombre']));
        }
        const excelBosq = document.getElementById('excel-bosq');
        if (excelBosq) {
            excelBosq.addEventListener('change', (e) => this.importExcel(e, 'bosquejos', ['Nro', 'Titulo']));
        }

        const excelOra = document.getElementById('excel-ora');
        if (excelOra) {
            excelOra.addEventListener('change', (e) => {
                const tipo = document.getElementById('ora-tipo').value;
                this.importExcel(e, tipo, ['Nombre', 'Congregacion']);
            });
        }

        // Search Handlers
        ['search-cong', 'search-bosq', 'search-ora', 'consult-query'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                if (id === 'search-ora') this.renderOradores();
                else if (id === 'consult-query') this.renderConsultar();
                else this.renderLists();
            });
        });

        const btnSync = document.getElementById('btn-sync-now');
        if (btnSync) {
            btnSync.addEventListener('click', () => {
                alert("Sincronizando con la nube... (Simulado)");
            });
        }

        const btnSaveConfig = document.getElementById('btn-save-config');
        if (btnSaveConfig) {
            btnSaveConfig.addEventListener('click', () => {
                this.db.config = {
                    nombre: document.getElementById('cfg-cong-nombre').value,
                    nro: document.getElementById('cfg-cong-nro').value,
                    direccion: document.getElementById('cfg-direccion').value,
                    dias: document.getElementById('cfg-dias').value,
                    horario: document.getElementById('cfg-horario').value,
                    celular: document.getElementById('cfg-celular').value,
                    responsable: document.getElementById('cfg-responsable').value,
                    email: document.getElementById('cfg-email').value
                };
                this.save();
                alert("Configuración inicial guardada correctamente.");
            });
        }

        const btnExportPdf = document.getElementById('btn-export-pdf');
        if (btnExportPdf) {
            btnExportPdf.addEventListener('click', () => this.exportToPDF());
        }

        const btnShare = document.createElement('button');
        btnShare.className = 'btn-primary';
        btnShare.style = 'padding: 10px; background: #25d366; box-shadow: none; margin-left: 10px;';
        btnShare.id = 'btn-share-wa';
        btnShare.innerHTML = '<i data-lucide="share-2"></i>';
        if (btnExportPdf && !document.getElementById('btn-share-wa')) {
            btnExportPdf.parentNode.appendChild(btnShare);
            btnShare.addEventListener('click', () => this.exportToPDF(true));
            lucide.createIcons();
        }
    },

    importExcel(event, targetKey, columns) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (jsonData.length === 0) {
                    alert("El archivo Excel está vacío.");
                    return;
                }

                // Normalización de llaves (case-insensitive y sin espacios)
                const normalize = (str) => String(str).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const targetCols = columns.map(c => normalize(c));

                let count = 0;
                jsonData.forEach((row, index) => {
                    let entryId = "";
                    let entryValue = "";

                    // Buscar las columnas correctas en la fila
                    Object.keys(row).forEach(key => {
                        const normKey = normalize(key);
                        if (normKey === targetCols[0]) entryId = String(row[key]).trim();
                        if (normKey === targetCols[1]) entryValue = String(row[key]).trim();
                    });

                    if (entryId && entryValue) {
                        this.db[targetKey][entryId] = entryValue;
                        count++;
                    }
                });

                if (count > 0) {
                    this.save();
                    this.renderLists();
                    alert(`✅ ¡Éxito! Se han importado ${count} registros en ${targetKey}.`);
                } else {
                    alert(`⚠️ No se encontraron columnas válidas. Asegúrate de que el Excel tenga las columnas: "${columns.join('" y "')}".`);
                }
            } catch (err) {
                console.error("Error al procesar Excel:", err);
                alert("Error al procesar el archivo. Asegúrate de que sea un Excel válido (.xlsx o .xls).");
            }
            event.target.value = ''; 
        };
        reader.readAsArrayBuffer(file);
    },

    renderArreglos() {
        const filter = document.getElementById('filter-month').value;
        const list = document.getElementById('list-arreglos-results');
        if (!list || !filter) return;

        list.innerHTML = '';
        const filtered = this.db.arreglos.filter(a => a.fecha.startsWith(filter));
        
        if (filtered.length === 0) {
            list.innerHTML = '<p style="text-align:center; color:var(--text-dim); padding:20px;">Sin arreglos para este mes.</p>';
            return;
        }

        filtered.sort((a,b) => new Date(a.fecha) - new Date(b.fecha)).forEach(a => {
            list.innerHTML += `
                <div class="glass-card fade-in" style="border-left: 4px solid ${a.tipo === 'Visitante' ? 'var(--secondary)' : 'var(--primary)'}; margin-bottom:8px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <div style="font-weight:700;">${a.nombre}</div>
                            <div style="font-size:0.75rem; color:var(--text-muted);">${a.bosquejo}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.8rem; font-weight:700;">${a.fecha.split('-').reverse().join('/')}</div>
                            <div style="font-size:0.6rem; text-transform:uppercase; color:${a.tipo === 'Visitante' ? 'var(--secondary)' : 'var(--primary)'}">${a.tipo}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    },

    exportToPDF(share = false) {
        const filter = document.getElementById('filter-month').value;
        if (!filter) return alert("Selecciona primero un mes");

        const filtered = this.db.arreglos.filter(a => a.fecha.startsWith(filter));
        if (filtered.length === 0) return alert("Sin datos para este mes");

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.setTextColor(99, 102, 241);
        doc.text(`PROGRAMA DE DISCURSOS PÚBLICOS`, 105, 15, { align: 'center' });
        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text(`Mes: ${filter}`, 105, 22, { align: 'center' });

        const salientes = filtered.filter(a => a.tipo === 'Saliente').sort((a,b) => new Date(a.fecha) - new Date(b.fecha));
        const visitantes = filtered.filter(a => a.tipo === 'Visitante').sort((a,b) => new Date(a.fecha) - new Date(b.fecha));

        let currentY = 30;

        // SECCIÓN ANFITRIONA (SALIENTES)
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`CONGREGACIÓN ANFITRIONA: ${this.db.config.nombre || ''} (#${this.db.config.nro || ''})`, 14, currentY);
        
        doc.autoTable({
            startY: currentY + 5,
            head: [['Fecha', 'Orador', 'Congregación Destino', 'Bosquejo']],
            body: salientes.map(a => [a.fecha.split('-').reverse().join('/'), a.nombre, a.congregacion, a.bosquejo]),
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] },
            styles: { fontSize: 9 }
        });

        currentY = doc.lastAutoTable.finalY + 10;
        
        // Host (Our) Details Footer - Now under Anfitriona section
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Dirección: ${this.db.config.direccion || '---'}`, 14, currentY);
        doc.text(`Día de Reunión: ${this.db.config.dias || '---'} | Horario: ${this.db.config.horario || '---'}`, 14, currentY + 4);
        doc.text(`Responsable: ${this.db.config.responsable || '---'} | Contacto: ${this.db.config.celular || '---'} | Email: ${this.db.config.email || '---'}`, 14, currentY + 8);

        currentY = currentY + 20;

        // SECCIÓN VISITANTES
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text("ORADORES VISITANTES (Vienen a nuestra congregación)", 14, currentY);
        
        doc.autoTable({
            startY: currentY + 5,
            head: [['Fecha', 'Orador', 'Congregación Origen', 'Bosquejo']],
            body: visitantes.map(a => [a.fecha.split('-').reverse().join('/'), a.nombre, a.congregacion, a.bosquejo]),
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { fontSize: 9 }
        });

        currentY = doc.lastAutoTable.finalY + 10;
        
        // Visitor Congregation Details Logic (requested)
        // Group visitors by congregation to avoid duplicates
        const uniqueVisitorCongs = [...new Set(visitantes.map(v => v.congregacion.split(' - ')[0].trim()))];
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        
        uniqueVisitorCongs.forEach(cid => {
            const cdata = this.db.congregaciones[cid];
            if (cdata && typeof cdata === 'object') {
                doc.setFontSize(9);
                doc.setTextColor(0);
                doc.text(`DETALLES CONGREGACIÓN: ${cdata.nombre} (#${cid})`, 14, currentY);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Dirección: ${cdata.direccion || '---'}`, 14, currentY + 4);
                doc.text(`Día: ${cdata.dia || '---'} | Hora: ${cdata.hora || '---'} | Responsable: ${cdata.responsable || '---'} | Contacto: ${cdata.contacto || '---'}`, 14, currentY + 8);
                currentY += 15;
            }
        });

        if (share && navigator.share) {
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], `Arreglo_${filter}.pdf`, { type: 'application/pdf' });
            
            navigator.share({
                files: [file],
                title: 'Arreglo Oradores',
                text: 'Adjunto el programa de discursos públicos.'
            }).catch(err => console.error("Error compartiendo:", err));
        } else if (share) {
            alert("Tu navegador no soporta compartir archivos directamente. Se descargará el PDF.");
            doc.save(`Arreglo_${filter}.pdf`);
        } else {
            doc.save(`Arreglo_${filter}.pdf`);
        }
    },

    removeItem(collection, id) {
        if (confirm('¿Eliminar este registro?')) {
            delete this.db[collection][id];
            this.save();
            this.renderLists();
            if (collection === 'visitantes' || collection === 'salientes') this.renderOradores(collection);
            this.renderStats();
            this.updateDataLists();
        }
    },

    // --- PIN Logic ---
    pressPin(num) {
        if (this.currentPin.length < 4) {
            this.currentPin += num;
            this.updatePinDots();
        }

        if (this.currentPin.length === 4) {
            if (this.currentPin === this.correctPin) {
                setTimeout(() => this.navigate('dashboard'), 200);
            } else {
                alert("PIN Incorrecto");
                this.clearPin();
            }
        }
    },

    clearPin() {
        this.currentPin = '';
        this.updatePinDots();
    },

    updatePinDots() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, i) => {
            if (i < this.currentPin.length) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    },

    // --- Cloud / Manual Tools ---
    exportData() {
        const dataStr = JSON.stringify(this.db, null, 4);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'control_oradores_backup.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.readAsText(file,'UTF-8');
            reader.onload = readerEvent => {
                const content = readerEvent.target.result;
                try {
                    const imported = JSON.parse(content);
                    this.db = imported;
                    this.save();
                    alert("Datos importados con éxito");
                    location.reload();
                } catch(e) { alert("Archivo inválido"); }
            }
        }
        input.click();
    },

    // --- New Editing Logic ---
    startEditCong(id) {
        const data = this.db.congregaciones[id];
        if (!data) return;
        
        this.db.editingCong = id;
        document.getElementById('cong-nro').value = id;
        document.getElementById('cong-nombre').value = typeof data === 'string' ? data : data.nombre;
        document.getElementById('cong-direccion').value = data.direccion || '';
        document.getElementById('cong-dia').value = data.dia || '';
        document.getElementById('cong-hora').value = data.hora || '';
        document.getElementById('cong-responsable').value = data.responsable || '';
        document.getElementById('cong-contacto').value = data.contacto || '';
        
        document.getElementById('btn-save-cong').innerText = 'Actualizar Datos';
        document.getElementById('btn-cancel-cong').style.display = 'block';
        
        document.querySelector('#screen-congregaciones .scrollable').scrollTo({ top: 0, behavior: 'smooth' });
    },

    startEditOra(tipo, nombre) {
        const info = this.db[tipo][nombre];
        if (!info) return;

        this.db.editingOra = { tipo, nombre };
        document.getElementById('ora-tipo').value = tipo;
        document.getElementById('ora-nombre').value = nombre;
        document.getElementById('ora-cong-nro').value = info.nro_cong;
        
        document.getElementById('btn-save-ora').innerText = 'Actualizar Datos';
        document.getElementById('btn-cancel-ora').style.display = 'block';
        
        this.renderOradores(); // Refresh to show detail editor
        document.querySelector('#screen-oradores .scrollable').scrollTo({ top: 0, behavior: 'smooth' });
    },

    addBosquejoToOrador() {
        if (!this.db.editingOra) return;
        const bid = document.getElementById('ora-bosq-add').value;
        if (!bid) return;

        const { tipo, nombre } = this.db.editingOra;
        if (!this.db[tipo][nombre].bosquejos) this.db[tipo][nombre].bosquejos = [];
        
        if (!this.db[tipo][nombre].bosquejos.includes(bid)) {
            this.db[tipo][nombre].bosquejos.push(bid);
            this.save();
            this.renderOradores();
        } else {
            alert("Este tema ya está vinculado.");
        }
    },

    removeBosquejoFromOrador(index) {
        if (!this.db.editingOra) return;
        const { tipo, nombre } = this.db.editingOra;
        this.db[tipo][nombre].bosquejos.splice(index, 1);
        this.save();
        this.renderOradores();
    }
};

window.addEventListener('DOMContentLoaded', () => app.init());
