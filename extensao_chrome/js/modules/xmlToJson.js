<<<<<<< HEAD
function convertXmlToJson(xml) {
    try {
=======
/**
 * Traduz mensagens de erro técnicas do DOMParser para mensagens mais amigáveis.
 * @param {string | Error} error - A mensagem de erro original do parser ou um objeto de Error.
 * @returns {string} - A mensagem de erro amigável.
 */
function translateXmlError(error) {
    const technicalError = (typeof error === 'string' ? error : error.message).toLowerCase();

    if (technicalError.includes("start tag expected")) {
        return "Erro de Sintaxe no XML: O documento parece não começar com uma tag válida (ex: <root>).";
    }
    if (technicalError.includes("mismatched tag") || technicalError.includes("tag mismatch")) {
        return "Erro de Aninhamento no XML: Uma tag foi fechada na ordem errada. Exemplo: <a><b></a></b>.";
    }
    if (technicalError.includes("not closed")) {
        return "Erro de Sintaxe no XML: Uma tag foi aberta, mas nunca foi fechada.";
    }
    
    if (technicalError.includes("junk after document element") || technicalError.includes("extra content at the end")) {
        return "Erro Estrutural no XML: O documento só pode ter um elemento raiz. Verifique se não há tags extras fora da tag principal.";
    }
    
    // Limpa a mensagem padrão do parser se não for um erro conhecido
    const cleanError = (typeof error === 'string' ? error : error.message)
        .replace("This page contains the following errors:", "")
        .replace(/Below is a rendering of the page up to the first error\./i, "")
        .trim();
    return `Erro ao processar o XML: ${cleanError}`;
}


/**
 * Converte uma string XML para uma string JSON.
 * @param {string} xml - A string XML de entrada.
 * @returns {string} - A string JSON formatada.
 * @throws {Error} - Lança um erro com mensagem amigável em caso de falha.
 */
function convertXmlToJson(xml) {
    try {
        if (!xml.trim()) {
            throw new Error("O campo de entrada está vazio. Por favor, insira um XML.");
        }

>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xml, "text/xml");

        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            const errorText = parseError[0].innerText || parseError[0].textContent;
<<<<<<< HEAD
            throw new Error(errorText.replace("This page contains the following errors:", "").trim());
        }

        function xmlNodeToJson(node) {
            if (node.nodeType === 3) {
                return node.nodeValue.trim();
            }

            if (node.nodeType === 1 && node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
                return node.childNodes[0].nodeValue.trim();
            }
            
            let obj = {};
            
            // Atributos
=======
            throw new Error(errorText);
        }

        function xmlNodeToJson(node) {
            // ... (A lógica interna de conversão permanece a mesma)
            if (node.nodeType === 3) return node.nodeValue.trim();
            if (node.nodeType === 1 && node.childNodes.length === 1 && node.childNodes[0].nodeType === 3) {
                return node.childNodes[0].nodeValue.trim();
            }
            let obj = {};
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
            if (node.attributes && node.attributes.length > 0) {
                obj["@attributes"] = {};
                for (let j = 0; j < node.attributes.length; j++) {
                    const attribute = node.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
<<<<<<< HEAD

            // Nós filhos
            for (let i = 0; i < node.childNodes.length; i++) {
                const item = node.childNodes.item(i);
                const nodeName = item.nodeName;

                // Ignora nós de texto vazios
                if (item.nodeType === 3 && !item.nodeValue.trim()) {
                    continue;
                }

=======
            for (let i = 0; i < node.childNodes.length; i++) {
                const item = node.childNodes.item(i);
                const nodeName = item.nodeName;
                if (item.nodeType === 3 && !item.nodeValue.trim()) continue;
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
                if (typeof obj[nodeName] === "undefined") {
                    obj[nodeName] = xmlNodeToJson(item);
                } else {
                    if (typeof obj[nodeName].push === "undefined") {
                        const old = obj[nodeName];
                        obj[nodeName] = [old];
                    }
                    obj[nodeName].push(xmlNodeToJson(item));
                }
            }
            return obj;
        }

<<<<<<< HEAD
=======
        if (!xmlDoc.documentElement) {
             throw new Error("Documento XML inválido ou vazio.");
        }

>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
        const result = xmlNodeToJson(xmlDoc.documentElement);
        return JSON.stringify({ [xmlDoc.documentElement.nodeName]: result }, null, 4);

    } catch (e) {
<<<<<<< HEAD
        throw new Error(`Erro ao converter XML para JSON: ${e.message}`);
=======
        throw new Error(translateXmlError(e));
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
    }
}

export { convertXmlToJson };