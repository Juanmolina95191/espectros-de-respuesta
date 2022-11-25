/*Importación de los datos del .txt */
import {DATA_CENTRO} from './Sismo El Centro.js';
import {DATA_KOBE} from './Sismo Kobe.js';
import {DATA_NORTHRIDGE} from './Sismo Northridge.js';
import {DATA_SANFERNANDO} from './Sismo San Fernando.js';
// const DATA = [
//     {
//      "Tiempo": 0,
//      "Aceleracion": 0
//     },
//     {
//      "Tiempo": 0.02,
//      "Aceleracion": 0.0063
//     },
//     {
//      "Tiempo": 0.04,
//      "Aceleracion": 0.00364
//     },
//     {
//      "Tiempo": 0.06,
//      "Aceleracion": 0.00099
//     },
//     {
//      "Tiempo": 0.08,
//      "Aceleracion": 0.00428
//     }
// ]

/*Aqui atrapamos los datos seleccionados por el usuario */
const dataSelect = document.getElementById("data");
const amortiguamientoSelect = document.getElementById("valueE");
const masaSelect = document.getElementById("masa");
const button = document.getElementById("btnComenzar");

/*GLOBALES - Aqui declaramos los arreglos/vectores que representan cada columna */
let Aceleracion = [], Fexc = [], ConstA = [], ConstB = [],
ConstC = [], ConstD = [], DesRel = [], VelRel = [], AceRel = [],
AceAbs = [], AceRelNor = [], PVel = [], PAce = [], PAceNor = [];

let maximos = [];

button.addEventListener("click", ()=>{
    let selectedData = dataSelect.options[dataSelect.selectedIndex].value;
    let selectedAmortiguamiento = amortiguamientoSelect.options[amortiguamientoSelect.selectedIndex].value;
    let selectedMasa = masaSelect.value;
    let dataUser = {};

    if(selectedMasa === "") {
        alert("Ingrese el valor de la masa");
    }else {  
        console.log("entra");
        if (selectedData === "Centro") {
            dataUser = DATA_CENTRO;
        } else if (selectedData === "Kobe"){
            dataUser = DATA_KOBE;
        } else if (selectedData === "Northridge"){
            dataUser = DATA_NORTHRIDGE;
        } else if(selectedData === "San Fernando") {
            dataUser = DATA_SANFERNANDO;
        }   
        /**Se realizan las operaciones*/
        /*se itera de 0 a 10 de a 0.01 */

        let vecDatosPeriodo = [];
        let periodo = 0;
        for (let index = 0; index < 1000; index++) {
            periodo = periodo+0.01;
            /***************Reseteamos vectores***************/
            Aceleracion = []; 
            Fexc = []; 
            ConstA = []; 
            ConstB = [];
            ConstC = []; 
            ConstD = []; 
            DesRel = []; 
            VelRel = []; 
            AceRel = [];
            AceAbs = []; 
            AceRelNor = []; 
            PVel = []; 
            PAce = []; 
            PAceNor = [];
            maximos = [];

            calcularDatos(dataUser, selectedAmortiguamiento, selectedMasa, periodo, selectedData);
            console.log("Con un periodo de ",periodo);
            console.log("maximos",maximos);
            vecDatosPeriodo.push(maximos);
            maximos = [];
        }
    }
})



/***************GLOBALES - MAXIMOS VECTOR***************/
function calcularDatos(DATA, amortiguamiento, masa, per, whitchData) {
    /*Datos que ingresa el usuario*/
    let E = parseInt(amortiguamiento)/100;
    let m = parseInt(masa);

    let periodo = per;
    let w =  (2*Math.PI)/periodo;
    let wa = w*(Math.sqrt(1-(Math.pow(E,2))));
    let Dt = 0.02;
    let c = 2*E*w*m;
    let K = Math.pow(w,2)*m;

    /*Aqui añadimos el primer valor que es cero */
    Aceleracion.push(0);
    Fexc.push(0);
    DesRel.push(0);
    VelRel.push(0);
    AceRel.push(0);
    AceAbs.push(0);
    AceRelNor.push(0);

    fillAceleracion(DATA, whitchData);
    //console.log("valores acel", Aceleracion);
    
    fillFexc(m);
    //console.log("valores fexc", Fexc);

    /********************************Llenado de las constantes*********************************/
    fillConstA(Dt, K);
    //console.log("valores de A", ConstA)
    
    fillConstB(c, K)
    //console.log("valores de B", ConstB)
    
    fillDesyVelRel(wa, Dt, E, w);
    
    fillAceRel(m, K, c, DATA);
    
    fillAceAbs(DATA);
    
    fillAceRelNor(DATA);
    
    // /**********************************Llenando pseudos********************************/
    fillPVel(w, DATA);
    
    fillPAce(w, DATA);
    
    fillPAceNor(DATA);
}

/********************************* Funciones*********************************/
function fillAceleracion(DATA, whitchData) {
    if(whitchData === "San Fernando"){
        DATA.map((elemento, ind) => {
            if (ind !== 0) {
                Aceleracion.push(elemento.Aceleracion/100);
            }
        });
    }else {
        DATA.map((elemento, ind) => {
            if (ind !== 0) {
                Aceleracion.push(elemento.Aceleracion*(9.8066)*(1/0.0254));
            }
        });
    }
}

function fillFexc(m) {// [0, 1.555, 74.94, 7, 2]
    Aceleracion.map((elemento, ind) => {
        if (ind !== 0) {
            Fexc.push(elemento*m*-1);
        }
    })
   
}

function fillConstA(Dt, K){// [0, 1.555, 74.94, 7, 2]
    for (let index = 0; index < Fexc.length - 1; index++) {
        let eleAct = Fexc[index];
        let eleSig = Fexc[index + 1];
        let valor = (eleSig-eleAct)/(Dt*K);
        ConstA.push(valor);
    }
    ConstA.push(0)
}

function fillConstB(c, K){
   
    for (let index = 0; index < Fexc.length; index++) {
        let F0 = Fexc[index];
        let A = ConstA[index];
        let valor = ((F0-c*A)/K);
        ConstB.push(valor);
    }
}
 
function fillDesyVelRel(wa, Dt, E, w) {
    for (let index = 0; index < Fexc.length; index++) {
        if (index == 0) {
            ConstC.push(DesRel[index] - ConstB[index]);
            ConstD.push((VelRel[index] + ConstC[index]*E*w - ConstA[index]) / wa);
        }else {
            let valor1 = (Math.exp(E*w*Dt*-1) * (ConstC[index-1]*Math.cos(wa*Dt) + ConstD[index-1]*Math.sin(wa*Dt))) + ConstB[index-1] + ConstA[index-1]*Dt;
            let valor2 = (Math.exp(E*w*Dt*-1)*(((ConstD[index-1]*wa) - (ConstC[index-1]*E*w)) * (Math.cos(wa*Dt)) - ((ConstC[index-1]*wa + ConstD[index-1]*E*w) * Math.sin(wa*Dt)))) + ConstA[index-1]
            DesRel.push(valor1);
            VelRel.push(valor2)
            ConstC.push(DesRel[index] - ConstB[index]);
            ConstD.push((VelRel[index] + (ConstC[index]*E*w) - ConstA[index]) / wa)
        }   
    }
    // console.log("DesRel: ",DesRel);
    // console.log("VelRel: ",VelRel);
    // console.log("ConstC: ",ConstC);
    // console.log("ConstD: ", ConstD);
    maximos.push(maxABS(DesRel));
    // console.log("Desp. relativo maximo", maximos[0])
    maximos.push(maxABS(VelRel));
    // console.log("Vel. relativa maxima", maximos[1])
}

function fillAceRel(m, K, c, DATA) {
    for (let index = 1; index < DATA.length; index++) {
        let valor = (m*Aceleracion[index]*-1 - c*VelRel[index] - K*DesRel[index]) / m ; 
        // console.log("fillAcelRel",valor);
        AceRel.push(valor);
    }
    // maximos.push(maxabs(AceRel));
    // console.log("aceleracion relativa", AceRel)
    maximos.push(maxABS(AceRel));
    // console.log("Ace. relativa maxima", maximos[2])
}

function fillAceAbs(DATA) {
    for (let index = 1; index < DATA.length; index++) {
        AceAbs.push((DATA[index].Aceleracion + AceRel[index]))
    }
    // console.log("aceleracion absoluta", AceAbs)
    maximos.push(maxABS(AceAbs));
    // console.log("Ace. Absoluta maxima", maximos[3])
}

function fillAceRelNor(DATA) {
    for (let index = 1; index < DATA.length; index++){
        AceRelNor.push((AceAbs[index] + Aceleracion[index]) / ((9.8066)*(1/0.0254)))
       
    }
    // console.log("acel.relativa normalizada", AceRelNor)
    maximos.push(maxABS(AceRelNor));
    // console.log("Ace. relativa normalizada maxima", maximos[4])
}

function fillPVel(w, DATA) {
    for (let index = 0; index < DATA.length; index++) {
        PVel.push((w * DesRel[index]))
    }
    // console.log("pseudo velocidad", PVel)
    maximos.push(maxABS(PVel));
    // console.log("Pseudovelocidad maxima", maximos[5])
}

function fillPAce(w, DATA) {
    for (let index = 0; index < DATA.length; index++) {
        PAce.push(Math.pow(w, 2) * - 1 * DesRel[index]);
    }
    // console.log("pseudo Aceleracion", PAce)
    maximos.push(maxABS(PAce));
    // console.log("Pseudoaceleracion maxima", maximos[6])
}

function fillPAceNor(DATA) {
    for (let index = 0; index < DATA.length; index++) {
        PAceNor.push(PAce[index] / ((9.8066)*(1/0.0254)));

    }
    // console.log("pseudo Aceleracion Norm", PAceNor)
    maximos.push(maxABS(PAceNor));
    // console.log("pseudoAceleracion Normalizada maxima", maximos[7])
}

function maxABS(vector) { //[0, -1.555, 74.94, -7, 2]
    //Aqui solo paso los valores abs 
    let vectorABS = vector.map((elemento) => { //[0, 1.555, 74.94, 7, 2]
        return Math.abs(Number.parseFloat(elemento).toFixed(4)); //RETORNA LOS VALORES POSITIVOS//
    });
   // Del vector de abs se saca el maximo valor 
   let maximo = Math.max(...vectorABS);
    return maximo;
}


   
   






