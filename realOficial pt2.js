const fs = require("fs");

main();

function main(){
    let array = lerTxt();

    let contadorDeLinhas = lerRestricoes(array);

    let [contadorDeX, tipoOtimizacao] = lerQauntidadeX(array, contadorDeLinhas);

    let valoresDesigualdade = adicionarVariaveis(array, contadorDeX);

    let [matrizCompleta, vetorExpressaoPrincipal] = preencherMatriz(array, contadorDeX, contadorDeLinhas);

    console.log('aqui esta a matriz completa:')
    console.table(matrizCompleta);

    let determinante = calcularDeterminante(matrizCompleta);

    console.log('aqui está o determinante da matriz: ', determinante);
    console.log('aqui está mostrando o vetor da expressão principal após adicionar as novas variaveis: ', vetorExpressaoPrincipal)
    
    /*let matrizQuadrada = criarMatrizQuadrada(matrizCompleta);
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
    console.table(matrizMultiplicada);*/

    let [matrizBasica, matrizNaoBasica, colunasParaBasica, colunasParaNaoBasica] = criarMatrizBasica(matrizCompleta);
    console.log("Matriz B = matriz básica (quadrada):");
    console.table(matrizBasica);
    console.log("Matriz N = matriz não básica (colunas restantes):");
    console.table(matrizNaoBasica);

    //verifica se é necessário a fase 1 ou não, retorna true ou false.
    if(verificaFaseI(array, vetorExpressaoPrincipal, valoresDesigualdade, matrizCompleta)[0]){
        faseI(matrizCompleta, valoresDesigualdade, vetorExpressaoPrincipal, tipoOtimizacao);
    } else{
        // vai para a fase II;
        if(faseI(matrizCompleta, valoresDesigualdade, vetorExpressaoPrincipal, tipoOtimizacao)){

        }
        faseII(matrizCompleta, valoresDesigualdade, vetorExpressaoPrincipal, tipoOtimizacao);
    }

}

function lerTxt(){
    const array = fs.readFileSync("teste.txt", "utf-8")
        .split("\n") //separa a cada quebra de linha
        .map(linha => linha.trim().replace(/\s+/g, "")) // elimina espaços em branco no começo e durante a string
        .filter(linha => linha !== ""); // se tiver linha nula ele ignora

    return array;
}

function lerRestricoes(array){
    let contadorDeLinhas = 0;
    for(let i=1; i<array.length; i++){
        if(array[i].includes(">=") || array[i].includes("<=")){
            contadorDeLinhas++;
        }
    }
    console.log("quantidade de linhas com restrições: ", contadorDeLinhas);

    return contadorDeLinhas;
}

function lerQauntidadeX(array){
    // Contar quantos "x" existem na fórmula principal
    let contadorDeX = 0;
    for(let i=0; i<array[0].length; i++){
        if(array[0][i] == "x"){
            contadorDeX++;
        }
    }
    let tipoOtimizacao;
    if(array[0].toLocaleLowerCase().startsWith("max")){
        tipoOtimizacao = "max";
        contadorDeX--;
    } else{
        tipoOtimizacao = "min";
    }
    console.log("quantidade de X na linha principal: ", contadorDeX);

    return [contadorDeX, tipoOtimizacao];
}

function adicionarVariaveis(array, contadorDeX){
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
        } else if(array[i].includes("=") && !array[i].includes(">=") && !array[i].includes("<=")){
            let [esquerda, direita] = array[i].split("=");
            valoresDesigualdade.push(eval(direita));
        }
    }

    console.log(`valores após desigualdade (vetor b): `, valoresDesigualdade);
    console.log("Array atualizado:", array);

    return valoresDesigualdade;
}

function preencherMatriz(array, contadorDeX, contadorDeLinhas){
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

    return [matrizCompleta, vetorExpressaoPrincipal];
}

function calcularDeterminante(matriz) {
    const n = matriz.length;

    if (n === 1) {
        return matriz[0][0]; // determinante de 1x1 é o próprio valor
    }

    let det = 0;
    const linha = 0; // expandindo sempre pela primeira linha

    for (let coluna = 0; coluna < n; coluna++) {
        det += ((-1) ** (linha + coluna)) * matriz[linha][coluna] * calcularDeterminante(subMatriz(matriz, linha, coluna));
    }
    return det;
}

function subMatriz(matriz, linha, coluna) {
    return matriz
        .filter((_, i) => i !== linha) // filtra de acordo com as linhas que não queremos exluir, fazendo com que a linha escolhida seja excluída
        .map(linhaAtual => linhaAtual.filter((_, j) => j !== coluna)); // remove a coluna 
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

function multiplicaMatriz(matriz1, matriz2){
    let matrizFinal = Array(matriz1.length).fill(null).map(() => Array(matriz2[0].length).fill(0));
    if(matriz1[0].length === matriz2.length){
        for(let i = 0; i<matriz1.length; i++){
            for(let j = 0; j<matriz2[0].length; j++){
                let somaMultiplicacao = 0;
                for(let k = 0; k<matriz1[0].length; k++){
                    somaMultiplicacao = somaMultiplicacao + (matriz1[i][k] * matriz2[k][j])
                }
                matrizFinal[i][j] = parseFloat(somaMultiplicacao.toPrecision(3));
            }
        }
    } else{
        console.log('n da pra multiplicar chefe');
    }
    return matrizFinal;
}

function criarMatrizBasica(matriz){
    // cria um vetor com os indices de acordo com a quantidade de X
    let indicesColunas = [...Array(matriz[0].length).keys()];

    console.log('\nindice de colunas organizado para da matriz básica e não básica: ', indicesColunas)

    console.log("aqui está a matriz completa");
    console.table(matriz);
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

function verificaFaseI(array, vetorExpressaoPrincipal, valoresDesigualdade, matrizCompleta){
    // aqui faz a verificação pra ver se é de máx, se for, ele multiplica funçao principal por -1
    if (array[0].toLowerCase().startsWith("max")) {
        for(let i = 0; i<vetorExpressaoPrincipal.length; i++){
            vetorExpressaoPrincipal[i] *= -1;
        }
    }

    // aqui faz a verificação se a possui algum valor da desiguladade que seja < 0, se tiver m,ultiplica toda a linha por -1
    for(let i = 0; i<valoresDesigualdade.length; i++){
        if(valoresDesigualdade[i] < 0){
            valoresDesigualdade[i] *= -1;
            for(let j = 0; j< matrizCompleta[i].length; j++){
                matrizCompleta[i][j] = matrizCompleta[i][j] * -1;
            }
        }
    }

    // aqui faz a verificação para saber se devemos mandá-lo ir para a fase 1 ou 2
    for (let i = 1; i < array.length; i++) {
        if (array[i].includes(">=") || array[i].includes(">")) {
            console.log("indo para a fase I");
            return [true, vetorExpressaoPrincipal, matrizCompleta];
        }

        if (array[i].includes("=") && !array[i].includes(">=") && !array[i].includes("<=")) {
            console.log("indo para a fase I");
            return [true, vetorExpressaoPrincipal, matrizCompleta];
        }
    }
    console.log("indo para a fase II");
    return [false, vetorExpressaoPrincipal, matrizCompleta];
}

function faseI(matrizCompleta, valoresDesigualdade, vetorExpressaoPrincipal, tipoOtimizacao){
    
}

function faseII(matrizCompleta, valoresDesigualdade, vetorExpressaoPrincipal, tipoOtimizacao){
    let iteracao = 1;
    while(true){
        console.log(`faseII, iteração: ${iteracao}`);

        let [matrizBasica, matrizNaoBasica, colunasParaBasica, colunasParaNaoBasica] = criarMatrizBasica(matrizCompleta);
        console.table(matrizBasica);
        console.table(matrizNaoBasica);
    
        let inversaBasica = criarMatrizIdentidade(matrizBasica, criarMatrizIdentidade(matrizBasica));
        //serve para colocar deixar em uma coluna porme com vairas linhas
        let vetorB = valoresDesigualdade.map(i => [i])
        let xBasico = multiplicaMatriz(inversaBasica, vetorB);
        console.table("x basico:");
        console.table(xBasico);
    
        //pega os custos da expressão principal e atribui conforme as colunas da basica, já transformando em matriz de colunas para que possa ser multiplicado
        let custoBasico = [colunasParaBasica.map(i => vetorExpressaoPrincipal[i])];
        console.log("custo nao basico: ", custoBasico);
        let yt = multiplicaMatriz(custoBasico, inversaBasica);
        console.table(yt)
    
        let custoNaoBasico = [colunasParaNaoBasica.map(i => vetorExpressaoPrincipal[i])];
        console.log("custo nao basico: ", custoNaoBasico);

        //descoberta de aNj (valores dos indices da não básicas direto da matrizCompleta);
        let aNj = Array(matrizCompleta.length).fill(0).map(() => Array(colunasParaNaoBasica.length).fill(0));
        for(let i = 0; i < matrizCompleta.length; i++){
            for(let j = 0; j < colunasParaNaoBasica.length; j++){
                aNj[i][j] = matrizCompleta[colunasParaBasica[i]][j];
            }
        }
        console.table(aNj);
        
        //multiplicação de yt * aNj
        let multiplicacao = multiplicaMatriz(yt, aNj);
        console.table(multiplicacao)
        let custoRelativo = [];
        // resolve o custo Relativo (cNj ← cNj − λT aNj )
        for(let i = 0; i < custoNaoBasico[0].length; i++){
            custoRelativo.push(custoNaoBasico[0][i] - multiplicacao[0][i]);
        }
        console.table("custoRelativo:");
        console.table(custoRelativo);

        //definir qual variável vai entrar na base (de acordo com o menor valor de custoRelativo)
        let indiceVariavelEntrada = custoRelativo.indexOf(Math.min(...custoRelativo));
        let variavelEntrada = (Math.min(...custoRelativo));
        console.log("indice da variavel de entrada:")
        console.log(indiceVariavelEntrada)
        console.log("valor minimo das variaveis:")
        console.log(variavelEntrada)

        //teste de otimilidade
        if(variavelEntrada >= 0){
            console.log(`solução ótima encontrada na iteração: ${iteracao}`);
            return variavelEntrada;//n sei se tenho q retornar isso aq mesmo, mas por enquanto é isso q vai ser
        }

        // aNk é a coluna k da matriz N (ou seja, a coluna k de aNj) foi feito pra poder descobrir a direção do simplex
        let aNk = aNj.map(linha => [linha[indiceVariavelEntrada]]);
        console.table(aNk);
        
        //calculo direção simplex
        let y = multiplicaMatriz(inversaBasica, aNk);
        console.table("calculo da direção simplex (y):");
        console.table(y);

        //determinação do passo e variável a sair da base(ve se tem algum valor y<=0)
        if(y.every(elemento => elemento<=0)){
            console.log(`para para paraaaaaaa, problema não tem solucão ótima finita`);
            console.log(y.map(elemento => elemento<=0));
            return null;
        }
        let epsilon = Infinity;
        let indiceSaida = -1
        // calcular essa porrinha aq (página 70 do pdf, passo 5)
        for(let i = 0; i < y.length; i++){
            if(y[i][0] > 0){
                let razao = xBasico[i][0]/y[i][0];
                console.log(razao)
                if(razao < epsilon){
                    epsilon = razao;
                    indiceSaida = i;
                    console.log(`Epsilon (ε̂): ${epsilon.toPrecision(3)}`);
                    console.log(`Índice da variável que sai da base: ${indiceSaida}`);
                }
            }
        }

        
        //passo 6:
        // Atualiza índices das colunas da base e não-base
        let entrando = colunasParaNaoBasica[indiceVariavelEntrada];
        let saindo = colunasParaBasica[indiceSaida];
        colunasParaBasica[indiceSaida] = entrando;
        colunasParaNaoBasica[indiceVariavelEntrada] = saindo;

        console.log(`Variável que entra na base: x${entrando + 1}`);
        console.log(`Variável que sai da base: x${saindo + 1}`);

        
        iteracao++;
    }
}