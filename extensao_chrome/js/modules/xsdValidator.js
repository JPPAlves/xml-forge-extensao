const XSD_NS = 'http://www.w3.org/2001/XMLSchema';

function stripPrefix(qname) {
  if (!qname) return qname;
  return qname.includes(':') ? qname.split(':')[1] : qname;
}

function childrenWithLocalName(node, localName) {
  const arr = [];
  if (!node || !node.childNodes) return arr;
  for (let i = 0; i < node.childNodes.length; i++) {
    const ch = node.childNodes[i];
    if (ch.nodeType === 1 && ch.localName === localName) arr.push(ch);
  }
  return arr;
}

function parseXsdDoc(xsdDoc) {
  const schemaEl = xsdDoc.documentElement;
  if (!schemaEl) throw new Error('Documento XSD vazio');

  const schema = { elements: new Map(), types: new Map() };

  for (let i = 0; i < schemaEl.childNodes.length; i++) {
    const ch = schemaEl.childNodes[i];
    if (ch.nodeType !== 1) continue;
    const ln = ch.localName;
    if (ln === 'complexType' || ln === 'simpleType') {
      const tname = ch.getAttribute('name');
      if (tname) schema.types.set(tname, parseType(ch));
    }
  }

  for (let i = 0; i < schemaEl.childNodes.length; i++) {
    const ch = schemaEl.childNodes[i];
    if (ch.nodeType !== 1) continue;
    if (ch.localName === 'element') {
      const name = ch.getAttribute('name');
      if (!name) continue;
      const typeAttr = ch.getAttribute('type');
      const elemDef = { name, typeName: typeAttr ? stripPrefix(typeAttr) : null, inline: null };
      const inlineCT = childrenWithLocalName(ch, 'complexType')[0];
      const inlineST = childrenWithLocalName(ch, 'simpleType')[0];
      if (inlineCT) elemDef.inline = parseType(inlineCT);
      else if (inlineST) elemDef.inline = parseType(inlineST);
      schema.elements.set(name, elemDef);
    }
  }

  return schema;
}

function parseType(node) {
  if (!node) return null;
  if (node.localName === 'simpleType') {
    const restriction = childrenWithLocalName(node, 'restriction')[0];
    const base = restriction ? stripPrefix(restriction.getAttribute('base')) : null;
    const result = { kind: 'simple', base, pattern: null, enumeration: [], minLength: null, maxLength: null };
    if (restriction) {
      for (let i = 0; i < restriction.childNodes.length; i++) {
        const f = restriction.childNodes[i];
        if (f.nodeType !== 1) continue;
        switch (f.localName) {
          case 'pattern': result.pattern = f.getAttribute('value'); break;
          case 'enumeration': result.enumeration.push(f.getAttribute('value')); break;
          case 'minLength': result.minLength = parseInt(f.getAttribute('value'), 10); break;
          case 'maxLength': result.maxLength = parseInt(f.getAttribute('value'), 10); break;
          default: break;
        }
      }
    }
    return result;
  }

  if (node.localName === 'complexType') {
    const result = { kind: 'complex', sequence: [], attributes: [] };
    const seq = childrenWithLocalName(node, 'sequence')[0];
    if (seq) {
      for (let i = 0; i < seq.childNodes.length; i++) {
        const e = seq.childNodes[i];
        if (e.nodeType !== 1) continue;
        if (e.localName === 'element') {
          let name = e.getAttribute('name');
          if (!name) {
            const ref = e.getAttribute('ref');
            if (ref) name = stripPrefix(ref);
          }
          const typeAttr = e.getAttribute('type');
          const minOccurs = e.getAttribute('minOccurs') || '1';
          const maxOccurs = e.getAttribute('maxOccurs') || '1';
          const seqItem = { name: name ? stripPrefix(name) : null, typeName: typeAttr ? stripPrefix(typeAttr) : null, inlineType: null, minOccurs, maxOccurs };
          const inlineCT = childrenWithLocalName(e, 'complexType')[0];
          const inlineST = childrenWithLocalName(e, 'simpleType')[0];
          if (inlineCT) seqItem.inlineType = parseType(inlineCT);
          else if (inlineST) seqItem.inlineType = parseType(inlineST);
          result.sequence.push(seqItem);
        }
      }
    }

    for (let i = 0; i < node.childNodes.length; i++) {
      const ch = node.childNodes[i];
      if (ch.nodeType !== 1) continue;
      if (ch.localName === 'attribute') {
        const aname = ch.getAttribute('name');
        const atype = ch.getAttribute('type');
        const use = ch.getAttribute('use') || 'optional';
        result.attributes.push({ name: aname, typeName: atype ? stripPrefix(atype) : null, use });
      }
    }

    return result;
  }

  return null;
}

function resolveType(typeName, schema) {
  if (!typeName) return null;
  const bare = stripPrefix(typeName);
  const builtins = ['string', 'integer', 'int', 'decimal', 'boolean', 'date', 'dateTime', 'float', 'double'];
  if (builtins.includes(bare)) return { kind: 'builtin', base: bare };
  if (schema.types.has(bare)) return schema.types.get(bare);
  return null;
}

function validateSimpleValue(value, typeDef) {
  const v = (value === null || value === undefined) ? '' : String(value).trim();
  if (!typeDef) return null;
  if (typeDef.kind === 'builtin') return checkBuiltin(v, typeDef.base);
  if (typeDef.kind === 'simple') {
    if (typeDef.base) {
      const baseErr = checkBuiltin(v, typeDef.base);
      if (baseErr) return baseErr;
    }
    if (typeDef.enumeration && typeDef.enumeration.length > 0) {
      if (!typeDef.enumeration.includes(v)) return `valor "${v}" não é um dos valores permitidos: ${typeDef.enumeration.join(', ')}`;
    }
    if (typeDef.pattern) {
      let re;
      try { re = new RegExp(typeDef.pattern); } catch (e) { return `pattern inválido no XSD: ${typeDef.pattern}`; }
      if (!re.test(v)) return `valor "${v}" não corresponde ao pattern: ${typeDef.pattern}`;
    }
    if (typeDef.minLength !== null && v.length < typeDef.minLength) return `comprimento mínimo ${typeDef.minLength} não satisfeito (${v.length})`;
    if (typeDef.maxLength !== null && v.length > typeDef.maxLength) return `comprimento máximo ${typeDef.maxLength} excedido ( ${v.length} )`;
    return null;
  }
  return null;
}

function checkBuiltin(v, base) {
  if (!base) return null;
  switch (base) {
    case 'string': return null;
    case 'integer':
    case 'int':
      if (/^-?\d+$/.test(v)) return null;
      return `valor "${v}" não é um inteiro válido`;
    case 'decimal':
    case 'float':
    case 'double':
      if (/^-?\d+(\.\d+)?$/.test(v)) return null;
      return `valor "${v}" não é um decimal válido`;
    case 'boolean':
      if (v === 'true' || v === 'false' || v === '1' || v === '0') return null;
      return `valor "${v}" não é boolean (true/false/1/0)`;
    case 'date':
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
      return `valor "${v}" não corresponde ao formato date (YYYY-MM-DD)`;
    case 'dateTime':
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(v)) return null;
      return `valor "${v}" não corresponde ao formato dateTime (YYYY-MM-DDThh:mm[:ss])`;
    default:
      return null;
  }
}

function validateElement(xmlEl, elemDefOrSeqItem, path, schema, errors) {
  const nodeName = xmlEl.localName;
  let typeDef = null;
  if (elemDefOrSeqItem.inline) typeDef = elemDefOrSeqItem.inline;
  else if (elemDefOrSeqItem.inlineType) typeDef = elemDefOrSeqItem.inlineType;
  else if (elemDefOrSeqItem.typeName) typeDef = resolveType(elemDefOrSeqItem.typeName, schema);

  if (!typeDef) {
    if (xmlEl.children && xmlEl.children.length > 0) {
      errors.push(`${path}: elemento tem filhos mas o XSD não define um complexType para "${nodeName}"`);
    }
    return;
  }

  if (typeDef.kind === 'builtin' || typeDef.kind === 'simple') {
    const value = xmlEl.textContent || '';
    const err = validateSimpleValue(value, typeDef.kind === 'builtin' ? { kind: 'builtin', base: typeDef.base } : typeDef);
    if (err) errors.push(`${path}: ${err}`);
    return;
  }

  if (typeDef.kind === 'complex') {
    for (const attrDef of typeDef.attributes) {
      const aname = attrDef.name;
      const use = attrDef.use || 'optional';
      if (use === 'required' && !xmlEl.hasAttribute(aname)) {
        errors.push(`${path}: atributo obrigatório "${aname}" ausente`);
      }
      if (xmlEl.hasAttribute(aname) && attrDef.typeName) {
        const atype = resolveType(attrDef.typeName, schema);
        const aval = xmlEl.getAttribute(aname);
        const aerr = validateSimpleValue(aval, atype);
        if (aerr) errors.push(`${path}[@${aname}]: ${aerr}`);
      }
    }

    const xmlChildren = Array.from(xmlEl.childNodes).filter(n => n.nodeType === 1);
    let pos = 0;
    for (const seqItem of typeDef.sequence) {
      const expectedName = seqItem.name;
      const min = parseInt(seqItem.minOccurs || '1', 10);
      const max = seqItem.maxOccurs === 'unbounded' ? Infinity : parseInt(seqItem.maxOccurs || '1', 10);
      let count = 0;

      while (pos < xmlChildren.length && xmlChildren[pos].localName === expectedName && count < max) {
        const childXml = xmlChildren[pos];
        const inlineForChild = seqItem.inlineType || seqItem.inline;
        validateElement(childXml, { name: expectedName, typeName: seqItem.typeName, inlineType: seqItem.inlineType, inline: inlineForChild }, `${path}/${expectedName}[${count + 1}]`, schema, errors);
        pos++;
        count++;
      }

      if (count < min) {
        errors.push(`${path}: faltam ocorrências do elemento "${expectedName}" (esperado min ${min}, encontrado ${count})`);
      }
    }

    if (pos < xmlChildren.length) {
      const extras = xmlChildren.slice(pos).map(c => c.localName);
      errors.push(`${path}: elementos inesperados encontrados: ${extras.join(', ')}`);
    }

    return;
  }
}

export async function validateXmlWithXsd(xmlString, xsdString) {
  return new Promise((resolve) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
      const xmlParserError = xmlDoc.getElementsByTagName('parsererror')[0] || (xmlDoc.documentElement && xmlDoc.documentElement.localName === 'parsererror' ? xmlDoc.documentElement : null);
      if (xmlParserError) {
        const errText = (xmlParserError.textContent || '').trim();
        resolve({ valid: false, message: `❌ Erro ao analisar XML: ${errText}` });
        return;
      }

      const xsdDoc = parser.parseFromString(xsdString, 'application/xml');
      const xsdParserError = xsdDoc.getElementsByTagName('parsererror')[0] || (xsdDoc.documentElement && xsdDoc.documentElement.localName === 'parsererror' ? xsdDoc.documentElement : null);
      if (xsdParserError) {
        const errText = (xsdParserError.textContent || '').trim();
        resolve({ valid: false, message: `❌ Erro ao analisar XSD: ${errText}` });
        return;
      }

      const schema = parseXsdDoc(xsdDoc);
      const root = xmlDoc.documentElement;
      const rootName = root.localName;
      const rootDef = schema.elements.get(rootName);
      if (!rootDef) {
        resolve({ valid: false, message: `❌ O XSD não declara o elemento global de nome "${rootName}". Verifique o XSD.` });
        return;
      }

      const errors = [];
      validateElement(root, rootDef, `/${rootName}`, schema, errors);

      if (errors.length === 0) {
        resolve({ valid: true, message: 'Sucesso! O XML é válido de acordo com o XSD.' });
      } else {
        const formatted = errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
        resolve({ valid: false, message: `Validação falhou com ${errors.length} erro(s):\n${formatted}` });
      }

    } catch (err) {
      resolve({ valid: false, message: `Erro interno durante a validação: ${err.message}` });
    }
  });
}
