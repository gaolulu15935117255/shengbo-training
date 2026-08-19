function success(res, data = null, message = 'ok') {
  return res.json({ code: 0, message, data });
}

function fail(res, code, message, data = null, httpStatus = 200) {
  return res.status(httpStatus).json({ code, message, data });
}

function paginate(list, page, pageSize, total) {
  return {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  };
}

function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let pageSize = parseInt(query.pageSize, 10) || 20;
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 20;
  if (pageSize > 100) pageSize = 100;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}

module.exports = { success, fail, paginate, parsePagination };
