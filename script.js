const canvas = document.getElementById('engineCanvas');
const ctx = canvas.getContext('2d');

let rpm = 800;
let targetRpm = 800;
let angle = 0;

let velocidadActualMs = 0;
let velocidadObjMs = 0;
let potenciaMotor = 350;
let masaVehiculoKg = 1100;
let simulacionActiva = true;

// Ajuste seguro de proporciones para que el pistón se mueva holgadamente dentro del cilindro
const crankRadius = 22;
const rodLength = 95;
const pistonWidth = 46;
const pistonHeight = 32;

let centerX = 110;
let crankshaftY = 175;

function ajustarResolucionCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const anchoVisual = 220;
    const altoVisual = 210;

    canvas.width = anchoVisual * dpr;
    canvas.height = altoVisual * dpr;

    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    canvas.style.width = `${anchoVisual}px`;
    canvas.style.height = `${altoVisual}px`;

    centerX = anchoVisual / 2;
    crankshaftY = 175;
}

window.addEventListener('load', () => {
    ajustarResolucionCanvas();
    gestionarSimulacion();
    animate();
});

window.addEventListener('resize', ajustarResolucionCanvas);

function animate() {
    const anchoVisual = canvas.width / (window.devicePixelRatio || 1);
    const altoVisual = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, anchoVisual, altoVisual);

    if (simulacionActiva && potenciaMotor > 0 && masaVehiculoKg > 0) {
        const rho = 1.225;
        const cx = 0.32;
        const area = 2.2;
        
        const fuerzaAero = 0.5 * rho * cx * area * Math.pow(velocidadActualMs, 2);
        const potenciaWatts = potenciaMotor * 745.7; 
        
        let fuerzaTraccion = velocidadActualMs > 0.5 ? (potenciaWatts / velocidadActualMs) : (potenciaWatts / 0.5);
        const fuerzaAdherenciaMax = 0.8 * masaVehiculoKg * 9.81; 
        fuerzaTraccion = Math.min(fuerzaTraccion, fuerzaAdherenciaMax);

        const fuerzaNeta = fuerzaTraccion - fuerzaAero;
        const aceleracion = fuerzaNeta / masaVehiculoKg;

        if (velocidadActualMs < velocidadObjMs) {
            velocidadActualMs += aceleracion * 0.016;
            if (velocidadActualMs > velocidadObjMs) velocidadActualMs = velocidadObjMs;
        } else if (velocidadActualMs > velocidadObjMs) {
            velocidadActualMs -= 3.5 * 0.016;
            if (velocidadActualMs < velocidadObjMs) velocidadActualMs = velocidadObjMs;
        }

        // Relación de RPM suave y realista basada en la velocidad alcanzada
        let rpmCalculadas = 800 + (velocidadActualMs / (180 / 3.6)) * 4500;
        targetRpm = Math.min(Math.max(rpmCalculadas, 800), 6500);

        rpm += (targetRpm - rpm) * 0.06; // Inercia más suave en el tacómetro

        if (rpm > 1) {
            const speed = (rpm / 60) * (Math.PI * 2) / 60;
            angle += speed;
        }
    } 

    // Cinemática segura de la biela y manivela dentro del cilindro
    const crankX = centerX + Math.sin(angle) * crankRadius;
    const crankY = crankshaftY - Math.cos(angle) * crankRadius;
    const deltaX = crankX - centerX;
    const term = Math.pow(rodLength, 2) - Math.pow(deltaX, 2);
    const pistonY = crankY - Math.sqrt(Math.max(0, term));

    ctx.strokeStyle = '#1b263b';
    ctx.fillStyle = '#1b263b';

    // Dibujo del bloque del cilindro
    ctx.lineWidth = 1.5;
    ctx.strokeRect(centerX - pistonWidth/2 - 6, 25, pistonWidth + 12, 130);
    
    // Dibujo del pistón
    ctx.fillRect(centerX - pistonWidth/2, pistonY - pistonHeight, pistonWidth, pistonHeight);

    // Dibujo de la biela
    ctx.beginPath();
    ctx.moveTo(centerX, pistonY);
    ctx.lineTo(crankX, crankY);
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Dibujo del cigüeñal (circunferencia)
    ctx.beginPath();
    ctx.arc(centerX, crankshaftY, crankRadius, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eje de la muñequilla del cigüeñal
    ctx.beginPath();
    ctx.arc(crankX, crankY, 3, 0, Math.PI * 2);
    ctx.fill();

    const rpmElem = document.getElementById('rpmDisplay');
    if (rpmElem) rpmElem.innerHTML = `${Math.round(rpm)}`;

    requestAnimationFrame(animate);
}

function gestionarSimulacion() {
    let potencia = parseFloat(document.getElementById('potencia').value);
    let masaKg = parseFloat(document.getElementById('peso').value);
    let velocidadKmh = parseFloat(document.getElementById('velocidad').value);

    if (isNaN(potencia) || isNaN(masaKg) || isNaN(velocidadKmh) || potencia <= 0 || masaKg <= 0 || velocidadKmh <= 0) {
        return;
    }

    velocidadObjMs = velocidadKmh / 3.6;

    const relacion = (masaKg / potencia).toFixed(2);
    document.getElementById('resPesoPotencia').innerText = `${relacion} kg/HP`;

    const mu = 0.8; 
    const g = 9.81; 
    const frenado = (Math.pow(velocidadObjMs, 2) / (2 * mu * g)).toFixed(1);
    document.getElementById('resFrenado').innerText = `${frenado} m`;

    const aero = (0.5 * 1.225 * 0.32 * 2.2 * Math.pow(velocidadObjMs, 2)).toFixed(1);
    document.getElementById('resAero').innerText = `${aero} N`;
}

function toggleSimulacion() {
    simulacionActiva = !simulacionActiva;
    const btn = document.getElementById('actionBtn');
    const statusDisplay = document.getElementById('statusDisplay');

    if (simulacionActiva) {
        btn.innerText = "[ Pausar ]";
        statusDisplay.innerText = "EN MARCHA";
        gestionarSimulacion();
    } else {
        btn.innerText = "[ Reanudar ]";
        statusDisplay.innerText = "EN PAUSA";
    }
}