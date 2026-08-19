const XLSX = require('xlsx');

const TYPE_MAP = {
  单选: 'single',
  单选题: 'single',
  single: 'single',
  多选: 'multiple',
  多选题: 'multiple',
  multiple: 'multiple',
  判断: 'judge',
  判断题: 'judge',
  judge: 'judge',
};

function parseAnswer(raw, type) {
  if (raw === undefined || raw === null || raw === '') {
    return { answer: null, error: '答案不能为空' };
  }
  const str = String(raw).trim().toUpperCase();
  const letterToIndex = (ch) => {
    const code = ch.charCodeAt(0);
    if (code >= 65 && code <= 90) return code - 65;
    return null;
  };

  if (type === 'judge') {
    if (['正确', '对', 'TRUE', 'T', '1', 'A', '是'].includes(str)) return { answer: [0] };
    if (['错误', '错', 'FALSE', 'F', '0', 'B', '否'].includes(str)) return { answer: [1] };
    return { answer: null, error: `判断题答案无效: ${raw}` };
  }

  const parts = str.split(/[,，、\s|/]+/).filter(Boolean);
  const indices = [];
  for (const part of parts) {
    if (/^\d+$/.test(part)) {
      indices.push(parseInt(part, 10));
    } else {
      for (const ch of part) {
        const idx = letterToIndex(ch);
        if (idx !== null) indices.push(idx);
      }
    }
  }
  const unique = [...new Set(indices)].sort((a, b) => a - b);
  if (!unique.length) return { answer: null, error: '答案格式无效' };
  if (type === 'single' && unique.length > 1) {
    return { answer: null, error: '单选题只能有一个答案' };
  }
  return { answer: unique };
}

function parseRow(row, rowNo, defaultSubcategoryName) {
  const errors = [];
  const typeRaw = row['题型'] || row.type || '';
  const type = TYPE_MAP[String(typeRaw).trim()] || null;
  if (!type) errors.push(`题型无效: ${typeRaw}`);

  const stem = String(row['题干'] || row.stem || '').trim();
  if (!stem) errors.push('题干不能为空');

  const options = [
    row['选项A'] ?? row.optionA,
    row['选项B'] ?? row.optionB,
    row['选项C'] ?? row.optionC,
    row['选项D'] ?? row.optionD,
  ]
    .map((o) => (o !== undefined && o !== null ? String(o).trim() : ''))
    .filter((o) => o !== '');

  if (type === 'judge' && options.length === 0) {
    options.push('正确', '错误');
  }
  if (options.length < 2) errors.push('至少需要两个选项');

  let answer = null;
  const answerRaw = row['答案'] ?? row.answer;
  if (type) {
    const parsed = parseAnswer(answerRaw, type);
    if (parsed.error) errors.push(parsed.error);
    else answer = parsed.answer;
  }

  if (answer && options.length) {
    const maxIdx = Math.max(...answer);
    if (maxIdx >= options.length) errors.push('答案索引超出选项范围');
  }

  const subcategoryName = String(row['子章节'] || row.subcategory || defaultSubcategoryName || '').trim() || null;

  const parsed = errors.length
    ? null
    : {
        type,
        stem,
        options,
        answer,
        analysis: String(row['解析'] || row.analysis || '').trim() || null,
        knowledge: String(row['知识点'] || row.knowledge || '').trim() || null,
        subcategoryName,
      };

  return { rowNo, valid: errors.length === 0, parsed, errors, raw: row };
}

function parseXlsxBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row, i) => parseRow(row, i + 2, null));
}

function parseTxtBuffer(buffer) {
  const text = buffer.toString('utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const items = [];
  let rowNo = 2;
  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 6) {
      items.push({
        rowNo,
        valid: false,
        parsed: null,
        errors: ['TXT 行格式无效，需制表符分隔: 题型\\t题干\\t选项A\\t选项B\\t选项C\\t选项D\\t答案\\t解析\\t知识点\\t子章节'],
        raw: { line },
      });
    } else {
      const row = {
        题型: parts[0],
        题干: parts[1],
        选项A: parts[2],
        选项B: parts[3],
        选项C: parts[4],
        选项D: parts[5],
        答案: parts[6],
        解析: parts[7] || '',
        知识点: parts[8] || '',
        子章节: parts[9] || '',
      };
      items.push(parseRow(row, rowNo, null));
    }
    rowNo += 1;
  }
  return items;
}

function parseImportFile(buffer, fileType) {
  const ext = (fileType || '').toLowerCase();
  if (ext === 'txt') return parseTxtBuffer(buffer);
  return parseXlsxBuffer(buffer);
}

module.exports = { parseImportFile, parseRow, parseAnswer };
