<<<<<<< HEAD
function convertJsonToXml(jsonString) {
    try {
        const json = JSON.parse(jsonString);
        
        let xml = '';

        function jsonToXmlRecursive(obj, tagName) {
            let attributes = '';
            let children = '';

            // Se o objeto não for um objeto 
            if (typeof obj !== 'object' || obj === null) {
                return `<${tagName}>${obj}</${tagName}>`;
=======
// As funções isValidXmlTagName e translateJsonError permanecem as mesmas.
function isValidXmlTagName(name) {
    const tagNameRegex = /^[a-zA-Z_][\w.-]*$/;
    return tagNameRegex.test(name);
}
function translateJsonError(error) {
    const message = error.message.toLowerCase();
    if (message.includes("unexpected token") || message.includes("invalid character") || message.includes("expected double-quoted property name")) {
        return "Erro de Sintaxe no JSON: O texto fornecido não é um JSON válido. Verifique vírgulas, aspas e a estrutura geral.";
    }
    if (message.includes("unexpected end of json input")) {
        return "Erro de Sintaxe no JSON: O JSON parece estar incompleto. Verifique se todos os colchetes e chaves foram fechados.";
    }
    if (message.includes("invalid xml tag name")) {
        return `Erro de Estrutura: O JSON contém uma chave que é inválida como tag XML. Detalhes: ${error.message}.`;
    }
    if (message.includes("o json de entrada deve ser um objeto")) {
        return "Erro de Estrutura: A entrada deve ser um objeto JSON (iniciando com '{'), e não um array (iniciando com '[') ou texto puro.";
    }
     if (message.includes("deve ter um único elemento raiz")) {
        return "Erro de Estrutura: O objeto JSON deve conter apenas uma chave no nível principal, que será a tag raiz do XML.";
    }
    if (message.includes("o campo de entrada está vazio")) {
        return "Erro de Entrada: O campo de texto está vazio. Por favor, insira um JSON para conversão.";
    }
    return `Erro ao converter JSON para XML: ${error.message}`;
}


function convertJsonToXml(jsonString) {
    try {
        if (!jsonString.trim()) {
            throw new Error("O campo de entrada está vazio.");
        }
        const json = JSON.parse(jsonString);
        if (typeof json !== 'object' || json === null || Array.isArray(json)) {
            throw new Error("O JSON de entrada deve ser um objeto.");
        }
        const rootKeys = Object.keys(json);
        if (rootKeys.length !== 1) {
            throw new Error("O JSON deve ter um único elemento raiz.");
        }
        
        // A FUNÇÃO RECURSIVA AGORA CONTROLA A INDENTAÇÃO ---
        function jsonToXmlRecursive(obj, tagName, indentLevel) {
            const indent = '  '.repeat(indentLevel); 
            
            if (!isValidXmlTagName(tagName)) {
                throw new Error(`Invalid XML tag name: "${tagName}"`);
            }

            let attributes = '';
            let children = '';
            let hasChildren = false;

            if (typeof obj !== 'object' || obj === null) {
                return `${indent}<${tagName}>${String(obj)}</${tagName}>\n`;
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
            }

            if (obj['@attributes']) {
                for (const key in obj['@attributes']) {
                    attributes += ` ${key}="${obj['@attributes'][key]}"`;
                }
<<<<<<< HEAD
                delete obj['@attributes']; 
            }
            
            for (const key in obj) {
                const child = obj[key];
                if (Array.isArray(child)) {
                    child.forEach(item => {
                    
                        if (typeof item === 'object') {
                            children += jsonToXmlRecursive(item, key);
                        } else {
                            children += `<${key}>${item}</${key}>`;
                        }
                    });
                } else if (typeof child === 'object' && child !== null) {
                    children += jsonToXmlRecursive(child, key);
                } else {
                 
                    if(key === '#text') {
                        children += child;
                    } else {
                        children += `<${key}>${child}</${key}>`;
                    }
                }
            }
            
            return `<${tagName}${attributes}>${children}</${tagName}>`;
        }

        const rootTag = Object.keys(json)[0];
        xml = jsonToXmlRecursive(json[rootTag], rootTag);
        
        return `<?xml version="1.0" encoding="UTF-8"?>\n` + xml;

    } catch (e) {
        throw new Error(`Erro ao converter JSON para XML: ${e.message}. Verifique se o JSON é válido.`);
=======
                delete obj['@attributes'];
            }
            
            for (const key in obj) {
                hasChildren = true;
                const child = obj[key];
                if (key === '#text') {
                    children += child;
                    continue;
                }
                if (Array.isArray(child)) {
                    child.forEach(item => { children += jsonToXmlRecursive(item, key, indentLevel + 1); });
                } else {
                    children += jsonToXmlRecursive(child, key, indentLevel + 1);
                }
            }
            
            if (hasChildren && children.trim().startsWith('<')) {
                // Se os filhos são outras tags, quebra a linha
                return `${indent}<${tagName}${attributes}>\n${children}${indent}</${tagName}>\n`;
            } else {
                // Se os filhos são apenas texto, mantém na mesma linha
                return `${indent}<${tagName}${attributes}>${children}</${tagName}>\n`;
            }
        }

        const rootTag = rootKeys[0];
        // Inicia a recursão com nível de indentação 0
        const xml = jsonToXmlRecursive(json[rootTag], rootTag, 0);
        
      
        return xml.trim(); 

    } catch (e) {
        throw new Error(translateJsonError(e));
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
    }
}

export { convertJsonToXml };