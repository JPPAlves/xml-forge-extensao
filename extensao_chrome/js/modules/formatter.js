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
            }
            return xmlString;
        }

        const formattedContent = processNode(xmlDoc.documentElement, 0).trim();
        return { formattedXml: (xmlDeclaration + formattedContent), error: null };

    } catch (e) {
        return { formattedXml: xml, error: { message: e.message, line: null } };
    }
}

function highlightSyntax(xml) {
    let escapedXml = xml
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escapedXml
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="syntax-comment">$1</span>')
        .replace(/(&lt;\?xml.*?\?&gt;)/g, '<span class="syntax-comment">$1</span>')
        .replace(/([a-zA-Z0-9_:-]+)=(".*?")/g, '<span class="syntax-attribute">$1</span>=<span class="syntax-string">$2</span>')
        .replace(/(&lt;\/?)([a-zA-Z0-9_:-]+)/g, '$1<span class="syntax-tag">$2</span>')
        .replace(/(&gt;|\/&gt;)/g, '<span class="syntax-tag">$1</span>')
        .replace(/(&gt;)([^&lt;]+?)(&lt;)/g, '$1<span class="syntax-text">$2</span>$3');
}

export { formatXml, highlightSyntax };