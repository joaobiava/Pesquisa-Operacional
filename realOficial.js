const fs = require("fs");

function lerTxt(){
    const array = fs.readFileSync("teste.txt", "utf-8")
        .split("\n") //separa a cada quebra de linha
        .map(linha => linha.trim().replace(/\s+/g, "")) // elimina espaços em branco no começo da string
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
            valoresDesigualdade.push(eval(direita));
            array[i] = `${esquerda}-x${indiceVariavelArtificial}>=${direita}`;
            indiceVariavelArtificial++;
        } else if (array[i].includes("<=")) {
            //separa entre valores antes e após a desigualdade
            let [esquerda, direita] = array[i].split("<=");
            //adiciona o valor após a desiguldade
            valoresDesigualdade.push(eval(direita));
            array[i] = `${esquerda}+x${indiceVariavelArtificial}<=${direita}`;
            indiceVariavelArtificial++;
        }
    }

    console.log(`valores após desigualdade (vetor b): `, valoresDesigualdade);
    console.log("Array atualizado:", array);
    preencherMatriz(array, contadorDeX, contadorDeLinhas, valoresDesigualdade);
}

function preencherMatriz(array, contadorDeX, contadorDeLinhas, valoresDesigualdade){
    // para inicialmente prenncher a mtriz com 0 caso n exista por exemplo um x1 em uma das expressões
    let matrizCompleta = Array(array.length - 1).fill(null).map(() => Array(contadorDeX+contadorDeLinhas).fill(0));

    // regex para analisar se há um valor antes de x e um valor após x, caso contrário n é aceito
    let regex = /([+-]?\d*\.?\d*)\*?x(\d+)/g;

    let vetorExpressaoPrincipal = []; // linha que inicializa o vetor com a quantidade de variaveis da linha pirincipal
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
    console.log('aqui está mostrando o vetor da expressão principal após adicionar as novas variaveis: ', vetorExpressaoPrincipal)
    
    let matrizQuadrada = criarMatrizQuadrada(matrizCompleta);
    console.log('\n aqui está a matriz quadrada:')
    console.table(matrizQuadrada);

    let identidade = criarMatrizIdentidade(matrizQuadrada);
    console.log(`matriz identidade: `)
    console.table(identidade);

    let matrizInversa = criarMatrizInversa(matrizQuadrada, identidade);
    console.log('aqui esta a matriz inversa da matriz quadrada:')
    console.table(matrizInversa);

    let matrizMultiplicada = multiplicaMatriz(matrizQuadrada, identidade);
    console.log('matriz após multiplicação');
    console.table(matrizMultiplicada);

    const [matrizBasica, matrizNaoBasica, colunasParaBasica, colunasParaNaoBasica] = criarMatrizBasica(matrizCompleta);
    console.log("Matriz B = matriz básica (quadrada):");
    console.table(matrizBasica);
    console.log("Matriz N = matriz não básica (colunas restantes):");
    console.table(matrizNaoBasica);

    primeiraIteracao(matrizBasica, matrizNaoBasica, valoresDesigualdade, vetorExpressaoPrincipal, colunasParaBasica, colunasParaNaoBasica);

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
    return identidade;
}

function criarMatrizInversa(matrizQuadrada, identidade){
    // copia a matriz quadrada e concatena com a matriz identidade, percorrendo e concatendando as linhas, concantena a linha da matriz com a linha da identidade
    let matrizAmpliada = matrizQuadrada.map((linha, i) => linha.concat(identidade[i]));
    console.log('matriz ampliada = juntar a matrizQuadrada com a matriz identidade')
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
    console.log('\norganizado após a aleatorização para a organização da matriz básica e não básica: ', indicesColunas)

    // considerando [1, 2, 3, 4, 5]
    // cria do elemento 0 até o tamnaho da matriz = [1, 2, 3]
    const colunasParaBasica = indicesColunas.slice(0, matriz.length);
    // cria a partir do tamanho da matriz até o final = [4, 5]
    const colunasParaNaoBasica = indicesColunas.slice(matriz.length);
    
    //crias a mtriaz basica  e n basica percorredno as linhas da matriz original e então analisando quais as colunas desejadas
    const matrizBasica = matriz.map(linha => colunasParaBasica.map(index => linha[index]));
    const matrizNaoBasica = matriz.map(linha => colunasParaNaoBasica.map(index => linha[index]));

    return [matrizBasica, matrizNaoBasica, colunasParaBasica, colunasParaNaoBasica];
}

function multiplicaMatriz(matriz1, matriz2){
    let matrizFinal = Array(matriz1.length).fill(null).map(() => Array(matriz2[0].length).fill(0));
    if(matriz1[0].length === matriz2.length){
        for(let i = 0; i<matriz1.length; i++){
            for(let j = 0; j<matriz2[0].length; j++){
                let somaMultiplicacao = 0;
                for(let k = 0; k<matriz1[0].length; k++){
                    somaMultiplicacao = somaMultiplicacao + (matriz1[i][k] * matriz2[k][j])
                }
                matrizFinal[i][j] = somaMultiplicacao;
            }
        }
    } else{
        console.log('n da pra multiplicar chefe');
    }
    return matrizFinal;
}

function primeiraIteracao(matrizBasica, matrizNaoBasica, valoresDesigualdade, vetorExpressaoPrincipal, colunasParaBasica, colunasParaNaoBasica) {
    console.log("\n========== Início Simplex ==========");

    const matrizIdentidade = criarMatrizIdentidade(matrizBasica);

    const inversaBasica = criarMatrizInversa(matrizBasica, matrizIdentidade);
    console.log("aqui está a matriz basica")
    console.table(matrizBasica);
    if (!inversaBasica) {
        console.log("Matriz Básica não é invertível, vai da nao rapaz");
        return;
    }

    const valoresDesigualdadeLinhas = valoresDesigualdade.map(bi => [bi]);
    const xB = multiplicaMatriz(inversaBasica, valoresDesigualdadeLinhas);

    console.log("\nSolução básica inicial x̂B:");
    console.log(xB);

    console.log(colunasParaBasica);
    /*como queremos saber a quantidade de colunas que precisamos, utilizamos o map em colunasParaBasica, e assim retornamos 
    os valores que temos na linha principal de acordo com os indices de colunasParaBasica*/
    const custosBasica = colunasParaBasica.map(i => [vetorExpressaoPrincipal[i]]);
    console.log(custosBasica);
    //fazemos a transposta para que possa multiplicar por uma matriz
    const custosBasicaTransposta = [colunasParaBasica.map(i => vetorExpressaoPrincipal[i])];
    console.log(custosBasicaTransposta);
    const lambdaBasicaTransposta = multiplicaMatriz(custosBasicaTransposta, inversaBasica);

    console.log("\nMultiplicador simplex λᵀ:");
    console.log(lambdaBasicaTransposta);

    /*como queremos saber a quantidade de colunas que precisamos, utilizamos o map em colunasParaNaoBasica, e assim retornamos 
    os valores que temos na linha principal de acordo com os indices de colunasParaNaoBasica*/
    const custosNaoBasica = colunasParaNaoBasica.map(i => [vetorExpressaoPrincipal[i]]);
    console.log(custosNaoBasica);
    const lambdaNaoBasica = multiplicaMatriz(lambdaBasicaTransposta, matrizNaoBasica); // aqui é feita a multiplicação (λT aNj)
    console.log(lambdaNaoBasica);
    // cNj ← cNj − λT aNj, literalmente isso, só que a multiplicação (λT aNj) foi feita anteriormente
    const custoReduzido = custosNaoBasica.map((val, i) => [val[0] - lambdaNaoBasica[0][i]]);
    console.log(custoReduzido);

    console.log("\nCustos reduzidos ĉN:");
    for(let i = 0; i < colunasParaBasica.length - 1; i++){
        console.log(`cn${colunasParaNaoBasica[i] + 1} = ${custoReduzido[i]}`);
    }

    //transforma em vetor ao invés de deixar em matriz
    const valores = custoReduzido.map(valor => valor[0]);
    console.log(valores);

    if (valores.every(valor => valor >= 0)) {
        console.log("\nSolução ótima já encontrada na primeira interação!");
        return;
    }


    // daqui pra frente deixa pra ver depoiis, pq o negócio é bruto, slk
    let var_entrada, y;
    for (let i = 0; i < valores.length; i++) {
        if (valores[i] < 0) {
            var_entrada = colunasParaNaoBasica[i];
            console.log(`\nTentando variável x${var_entrada + 1} como entrada (custo reduzido = ${valores[i]})`);
            const aNk = matrizNaoBasica.map(row => [row[i]]);
            y = multiplicaMatriz(inversaBasica, aNk);
            console.log("Direção simplex y:");
            y.forEach(row => console.log(row.map(val => val.toFixed(2))));

            if (y.some(row => row[0] > 0)) break;
        }
    }

    if (!y || y.every(row => row[0] <= 0)) {
        console.log("\nProblema ilimitado: nenhuma variável de entrada resulta em direção viável (y > 0).");
        return;
    }

    const razoes = [];
    for (let i = 0; i < xB.length; i++) {
        const yi = y[i][0];
        if (yi > 0) {
            razoes.push({ razao: xB[i][0] / yi, index: i });
        }
    }

    const { index: index_saida } = razoes.reduce((min, r) => r.razao < min.razao ? r : min);
    const var_saida = colunasParaBasica[index_saida];

    console.log(`\nVariável que sai da base: x${var_saida + 1}`);

    return { var_entrada, var_saida };
}

lerTxt();

/* 
pré fase 1:
função para que se a função principal for max trocar para min multiplicando tudo por -1 (nao fazer direto no array do txt)

se algum valor do vetor b (elementos após as restrições), multiplica por -1 toda a restrição

deve ter um sinal de >, >= ou = para pode ir para a fase 1, se não volta para a fase 2

fase 1:
página 68 do pdf
*/