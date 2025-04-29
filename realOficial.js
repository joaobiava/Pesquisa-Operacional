const fs = require("fs");

function lerTxt(){
    const array = fs.readFileSync("teste.txt", "utf-8")
        .split("\n") //separa a cada quebra de linha
        .map(linha => linha.trim()) // elimina espaços em branco no começo da string
        .filter(linha => linha !== ""); // se tiver linha nula ele ignora
    
    for(let i = 0; i<array.length; i++){
        if(!array[i].includes("=")){
            array.splice(i, 1);
        }
    }

    if (array[0].toLowerCase().startsWith("max")) {
        console.log("É max");
    } else if (array[0].toLowerCase().startsWith("min")) {
        console.log("É min");
    } else {
        console.log("Você deve digitar se é min ou max no começo");
    }

    lerRestricoes(array);
}

function lerRestricoes(array){
    let contadorDeLinhas = 0;
    for(let i=1; i<array.length; i++){
        if(array[i].includes(">=") || array[i].includes("<=")){
            contadorDeLinhas++;
        }
    }
    console.log("quantidade de linhas com restrições: ", contadorDeLinhas);

    lerQauntidadeX(array, contadorDeLinhas);
}

function lerQauntidadeX(array, contadorDeLinhas){
    // Contar quantos "x" existem na fórmula principal
    let contadorDeX = 0;
    for(let i=0; i<array[0].length; i++){
        if(array[0][i] == "x"){
            contadorDeX++;
        }
    }
    if(array[0].toLocaleLowerCase().startsWith("max")){
        contadorDeX--;
    }
    console.log("quantidade de X na linha principal: ", contadorDeX);
    adicionarVariaveis(array, contadorDeX, contadorDeLinhas);
}

function adicionarVariaveis(array, contadorDeX, contadorDeLinhas){
    // Adicionar novas variáveis às restrições. percorre ignorando a primeira linha = max/min
    let indiceVariavelArtificial = contadorDeX + 1; // começa depois das variáveis "normais"

    let valoresDesigualdade = [];

    for (let i = 1; i < array.length; i++) {
        if (array[i].includes(">=")) {
            //separa entre valores antes e após a desigualdade
            let [esquerda, direita] = array[i].split(">=");
            //adiciona o valor após a desiguldade
            valoresDesigualdade.push(direita);
            array[i] = `${esquerda}-x${indiceVariavelArtificial}>=${direita}`;
            indiceVariavelArtificial++;
        } else if (array[i].includes("<=")) {
            //separa entre valores antes e após a desigualdade
            let [esquerda, direita] = array[i].split("<=");
            //adiciona o valor após a desiguldade
            valoresDesigualdade.push(direita);
            array[i] = `${esquerda}+x${indiceVariavelArtificial}<=${direita}`;
            indiceVariavelArtificial++;
        }
    }

    console.log(`valores após desigualdade: `, valoresDesigualdade);
    console.log("Array atualizado:", array);
    preencherMatriz(array, contadorDeX, contadorDeLinhas);
}

function preencherMatriz(array, contadorDeX, contadorDeLinhas){
    // para inicialmente prenncher a mtriz com 0 caso n exista por exemplo um x1 em uma das expressões
    let matrizCompleta = Array(array.length - 1).fill(null).map(() => Array(contadorDeX+contadorDeLinhas).fill(0));

    // regex para analisar se há um valor antes de x e um valor após x, caso contrário n é aceito
    let regex = /([+-]?\d*\.?\d*)\*?x(\d+)/g;

    let vetorExpressaoPrincipal = []; // linah que inicializa o vetor com a quantidade de variaveis da linha pirincipal
    for (let i = 0; i < array.length; i++) {
        let expr = array[i];

        for (let match of expr.matchAll(regex)) {
            let coef = match[1];
            let xIndex = parseInt(match[2]) - 1;
            
            if (coef === "" || coef === "+") {
                coef = 1;
            } else if (coef === "-") {
                coef = -1;
            }
            
            // aqui é onde é atribuído os valores para o vetor da linha principal
            if(i === 0){
                vetorExpressaoPrincipal.push(parseFloat(coef));
            } else {
                matrizCompleta[i - 1][xIndex] = parseFloat(coef);
            }
        }
    }
    for(let i = 0; i < contadorDeLinhas; i++){
        vetorExpressaoPrincipal.push(0);
    }

    console.log('aqui esta a matriz completa:')
    console.table(matrizCompleta);
    console.log('aqui está o determinante da matrizCompleta: ', determinante(matrizCompleta));
    console.log('aqui está mostrando o vetor: ', vetorExpressaoPrincipal)
    matrizQuadrada = criarMatrizQuadrada(matrizCompleta);
    identidade = criarMatrizIdentidade(matrizQuadrada);
    matrizInversa = criarMatrizInversa(matrizQuadrada, identidade);
    criarMatrizBasica(matrizCompleta);
}

function subMatriz(matriz, linha, coluna) {
    return matriz
        .filter((_, i) => i !== linha) // filtra de acordo com as linhas que não queremos exluir, fazendo com que a linha escolhida seja excluída
        .map(linhaAtual => linhaAtual.filter((_, j) => j !== coluna)); // remove a coluna 
}

function determinante(matriz) {
    const n = matriz.length;

    if (n === 1) {
        return matriz[0][0]; // determinante de 1x1 é o próprio valor
    }

    if (n === 2) {
        // regra de Sarrus para 2x2, não é necessário, mas o código fica mais rápido para esse tipo de matriz
        return matriz[0][0] * matriz[1][1] - matriz[0][1] * matriz[1][0];
    }

    let det = 0;
    const linha = 0; // expandindo sempre pela primeira linha

    for (let coluna = 0; coluna < n; coluna++) {
        det += ((-1) ** (linha + coluna)) * matriz[linha][coluna] * determinante(subMatriz(matriz, linha, coluna));
    }
    return det;
}

function criarMatrizQuadrada(matrizCompleta){
    let n = matrizCompleta.length;
    //cria um array de tamanho de linhas da matriz completa, ent cria outro array e o preenche com 0, o que retorna um array de arrays
    let matrizQuadrada = Array.from({ length: matrizCompleta.length }, () => Array(matrizCompleta.length).fill(0));

    for(let i = 0; i < n; i++){
        for(let j = 0; j < n; j++){
            matrizQuadrada[i][j] = matrizCompleta[i][j]
        }
    }
    console.log('\n aqui está a matriz quadrada:')
    console.table(matrizQuadrada)
    return matrizQuadrada;
}

function criarMatrizIdentidade(matrizQuadrada){
    //cria um array de tamanho de linhas da matriz completa, ent cria outro array e o preenche com 0, o que retorna um array de arrays
    let identidade = Array.from({ length: matrizQuadrada.length }, () => Array(matrizQuadrada.length).fill(0));

    for (let i = 0; i < identidade.length; i++) {
        for (let j = 0; j < identidade.length; j++){
            if( i === j ){
                identidade[i][i] = 1;
            }
            else{
                identidade[i][j] = 0;
            }
        }
    }
    console.log(`matriz identidade: `);
    console.table(identidade);
    return identidade;
}

function criarMatrizInversa(matrizQuadrada, identidade){
    // copia a matriz quadrada e concatena com a matriz identidade, percorrendo e concatendando as linhas, concantena a linha da matriz com a linha da identidade
    let matrizAmpliada = matrizQuadrada.map((linha, i) => linha.concat(identidade[i]));
    console.log('matriz ampliada; matrizQuadrada junto com identidade')
    console.table(matrizAmpliada);


    for (let i = 0; i < matrizQuadrada.length; i++) {
        // Verifica se o pivô é zero e tenta permutar linhas
        if (matrizAmpliada[i][i] === 0) {
            let trocou = false;
            for (let k = i + 1; k < matrizQuadrada.length; k++) {
                if (matrizAmpliada[k][i] !== 0) {
                    [matrizAmpliada[i], matrizAmpliada[k]] = [matrizAmpliada[k], matrizAmpliada[i]];
                    trocou = true;
                    break;
                }
            }
            if (!trocou) {
                console.log('rapaz, vai dar pra inverter não');
                return null; // Não é invertível
            }
        }

        // Normaliza a linha do pivô
        let fator = matrizAmpliada[i][i];
        for (let j = 0; j < 2 * matrizQuadrada.length; j++) {
            matrizAmpliada[i][j] /= fator;
        }

        // Zera os outros elementos da coluna
        for (let k = 0; k < matrizQuadrada.length; k++) {
            if (k !== i) {
                let fator2 = matrizAmpliada[k][i];
                for (let j = 0; j < 2 * matrizQuadrada.length; j++) {
                    matrizAmpliada[k][j] -= fator2 * matrizAmpliada[i][j];
                }
            }
        }
    }

    // Pega apenas a parte da direita (a inversa)
    let inversa = matrizAmpliada.map(linha => linha.slice(matrizQuadrada.length));
    console.log('aqui esta a matriz inversa:')
    console.table(inversa);
    return inversa;
}

function criarMatrizBasica(matriz){
    // cria um vetor com os indices de acordo com a quantidade de X
    let indicesColunas = [...Array(matriz[0].length).keys()];

    // aleatoriza decrementando i, para que ele n repita os numeros
    for (let i = indicesColunas.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        // iguala o primeiro com o primeiro e o segundo com o segundo, literalmente assim
        // cria como se fossem variaveis temporarias a e b, e então as atribuisse ao lado esquerdo, fazendo com que os valores n sejam iguais
        [indicesColunas[i], indicesColunas[j]] = [indicesColunas[j],  indicesColunas[i]];
    }
    console.log('\norganizado após a aleatorização: ', indicesColunas)

    // considerando [1, 2, 3, 4, 5]
    // cria do elemento 0 até o tamnaho da matriz = [1, 2, 3]
    const colunasParaBasica = indicesColunas.slice(0, matriz.length);
    // cria a partir do tamanho da matriz até o final = [4, 5]
    const colunasParaNaoBasica = indicesColunas.slice(matriz.length);
    
    //crias a mtriaz basica  e n basica percorredno as linhas da matriz orioginal e então analisando quais as colunas desejadas
    const matrizBasica = matriz.map(linha => colunasParaBasica.map(index => linha[index]));
    const matrizNaoBasica = matriz.map(linha => colunasParaNaoBasica.map(index => linha[index]));

    console.log("Matriz B (quadrada):");
    console.table(matrizBasica)
    console.log("Matriz N (colunas restantes):");
    console.table(matrizNaoBasica)
}

lerTxt();