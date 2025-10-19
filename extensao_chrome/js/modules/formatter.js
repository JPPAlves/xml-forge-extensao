<<<<<<< HEAD
=======
/**
 * Traduz mensagens de erro técnicas do DOMParser para mensagens mais amigáveis.
 * @param {string} technicalError - A mensagem de erro original do parser.
 * @returns {string} - A mensagem de erro amigável.
 */
function translateErrorMessage(technicalError) {
    const error = technicalError.toLowerCase();

    if (error.includes("start tag expected")) {
        return "Erro de sintaxe: O documento deve começar com uma tag XML válida (ex: <root>). Verifique se não há texto solto no início do arquivo.";
    }
    if (error.includes("mismatched tag") || error.includes("tag mismatch")) {
        return "Erro de aninhamento: Uma tag foi fechada na ordem errada. Exemplo incorreto: <a><b></a></b>. O correto seria: <a><b></b></a>.";
    }
    if (error.includes("not closed")) {
        return "Erro de sintaxe: Uma tag foi aberta, mas nunca foi fechada. Verifique se todas as tags como `<tag>` possuem um `</tag>` correspondente.";
    }
    if (error.includes("junk after document element")) {
        return "Erro estrutural: O documento XML só pode ter um elemento raiz. Verifique se não há tags extras fora da tag principal.";
    }
    
    // Limpa a mensagem padrão caso não seja um erro conhecido
    const cleanError = technicalError
        .replace("This page contains the following errors:", "")
        .replace(/Below is a rendering of the page up to the first error\./i, "")
        .trim();
    return `Erro de análise XML: ${cleanError}`;
}

/**
 * Formata uma string XML com indentação e valida sua estrutura.
 * @param {string} xml - A string XML de entrada.
 * @returns {{formattedXml: string, error: {message: string, line: number}|null}}
 */
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
function formatXml(xml) {
    try {
        xml = xml.trim();
        const declarationMatch = xml.match(/^<\?xml[^>]*\?>\s*/i);
        const xmlDeclaration = declarationMatch ? declarationMatch[0] : "";
        const xmlContent = xml.substring(xmlDeclaration.length);

        if (!xmlContent.trim()) {
            if (xmlDeclaration) return { formattedXml: xmlDeclaration.trim(), error: null };
            throw new Error("Documento XML inválido ou incompleto. Nenhuma tag raiz foi encontrada.");
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "application/xml");

        const parseError = xmlDoc.getElementsByTagName("parsererror");
        if (parseError.length > 0) {
            const errorElement = parseError[0];
            const errorText = errorElement.innerText || errorElement.textContent;
            const lineMatch = errorText.match(/line number (\d+)/) || errorText.match(/linha (\d+)/);
            const lineNumber = lineMatch ? parseInt(lineMatch[1], 10) : null;
<<<<<<< HEAD
            return {
                formattedXml: xml,
                error: {
                    message: errorText.replace("This page contains the following errors:", "").trim(),
                    line: lineNumber
                }
            };
        }
        
        function processNode(node, indentation) {
            let xmlString = "";
            const indent = "\t".repeat(indentation);

            if (node.nodeType === 1) { // Element
                const attributes = Array.from(node.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
                xmlString += `${indent}<${node.nodeName}${attributes ? ' ' + attributes : ''}`;
                if (node.childNodes.length === 0) {
                    xmlString += "/>\n";
                } else if (node.childNodes.length === 1 && node.childNodes[0].nodeType === 3 && node.childNodes[0].nodeValue.trim() !== '') {
                    xmlString += `>${node.childNodes[0].nodeValue.trim()}</${node.nodeName}>\n`;
                } else {
                    xmlString += ">\n";
                    node.childNodes.forEach(child => {
                        xmlString += processNode(child, indentation + 1);
                    });
                    xmlString += `${indent}</${node.nodeName}>\n`;
                }
            } else if (node.nodeType === 8) { 
                xmlString += `${indent}\n`;
            } else if (node.nodeType === 4) { // CDATA
                xmlString += `${indent}<![CDATA[${node.nodeValue}]]>\n`;
=======
            const userFriendlyMessage = translateErrorMessage(errorText);
            
            return {
                formattedXml: xml,
                error: { message: userFriendlyMessage, line: lineNumber }
            };
        }
        
       
        // FUNÇÃO 'processNode' MODIFICADA
        function processNode(node, indentation) {
            let xmlString = "";
            const indent = "  ".repeat(indentation);

            switch (node.nodeType) {
                case 1: // Element
                    const attributes = Array.from(node.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
                    const tagAttributes = attributes ? ' ' + attributes : '';

                    const isTextOnlyNode = node.childNodes.length === 1 &&
                                           node.childNodes[0].nodeType === 3 &&
                                           node.childNodes[0].nodeValue.trim() !== '';

                    if (isTextOnlyNode) {
                        // 👉 NOVO COMPORTAMENTO: Se for verdade, formata em uma única linha.
                        const textContent = node.childNodes[0].nodeValue.trim();
                        xmlString += `${indent}<${node.nodeName}${tagAttributes}>${textContent}</${node.nodeName}>\n`;
                    } else if (node.hasChildNodes()) {
                        // 👉 COMPORTAMENTO ANTIGO (com melhoria): Se tiver outros nós (elementos), formata com aninhamento.
                        xmlString += `${indent}<${node.nodeName}${tagAttributes}>\n`;
                        node.childNodes.forEach(child => {
                            // Ignora nós de texto vazios (quebras de linha e espaços entre tags)
                            if (child.nodeType === 3 && !child.nodeValue.trim()) {
                                return;
                            }
                            xmlString += processNode(child, indentation + 1);
                        });
                        xmlString += `${indent}</${node.nodeName}>\n`;
                    } else {
                        // Comportamento para tags vazias: <tag/>
                        xmlString += `${indent}<${node.nodeName}${tagAttributes}/>\n`;
                    }
                    break;
                case 3: // Text (agora lida principalmente com conteúdo misto)
                    if (node.nodeValue.trim()) {
                        xmlString += `${indent}${node.nodeValue.trim()}\n`;
                    }
                    break;
                case 4: // CDATA
                    xmlString += `${indent}<![CDATA[${node.nodeValue}]]>\n`;
                    break;
                case 8: // Comment
                    xmlString += `${indent}\n`;
                    break;
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
            }
            return xmlString;
        }

        const formattedContent = processNode(xmlDoc.documentElement, 0).trim();
        return { formattedXml: (xmlDeclaration + formattedContent), error: null };

    } catch (e) {
        return { formattedXml: xml, error: { message: e.message, line: null } };
    }
}

<<<<<<< HEAD
=======
/**
 * Adiciona spans com classes CSS para destacar a sintaxe de uma string XML.
 * @param {string} xml - A string XML (preferencialmente já formatada).
 * @returns {string} - Uma string HTML com a sintaxe destacada.
 */
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
function highlightSyntax(xml) {
    let escapedXml = xml
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escapedXml
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="syntax-comment">$1</span>')
<<<<<<< HEAD
        .replace(/(&lt;\?xml.*?\?&gt;)/g, '<span class="syntax-comment">$1</span>')
        .replace(/([a-zA-Z0-9_:-]+)=(".*?")/g, '<span class="syntax-attribute">$1</span>=<span class="syntax-string">$2</span>')
        .replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, '$1<span class="syntax-tag">$2</span>')
        .replace(/(&gt;|\/&gt;)/g, '<span class="syntax-tag">$1</span>')
        .replace(/(&gt;)([^&lt;]+?)(&lt;)/g, '$1<span class="syntax-text">$2</span>$3');
}

=======
        .replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span class="syntax-processing-instruction">$1</span>')
        .replace(/(&lt;!\[CDATA\[[\s\S]*?\]\]&gt;)/g, '<span class="syntax-cdata">$1</span>')
        .replace(/([a-zA-Z0-9_:-]+)=(['"])(.*?)(\2)/g, '<span class="syntax-attribute-name">$1</span>=<span class="syntax-attribute-value">$2$3$4</span>')
        .replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, '$1<span class="syntax-tag-name">$2</span>')
        .replace(/(&lt;|&gt;|\/&gt;)/g, '<span class="syntax-punctuation">$1</span>')
        .replace(/(?<=>)([^<]+)(?=<)/g, '<span class="syntax-text">$1</span>');
}

// Exporta as funções para que possam ser usadas em outros arquivos
>>>>>>> 53eb5ee (feat: Implementação final das funcionalidades e melhorias de UI)
export { formatXml, highlightSyntax };