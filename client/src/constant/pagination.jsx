export const rulePaginate = {
  2: 2,
  3: 3,
  4: 8,
  5: 10,
  6: 18,
  7: 21,
  8: 32,
  9: 36,
  10: 50,
  11: 55,
  12: 72,
};

export const pagination = (items, current_page, per_page_items) => {
  let page = current_page || 1,
    per_page = per_page_items || 10,
    offset = (page - 1) * per_page,
    paginatedItems = items.slice(offset).slice(0, per_page_items),
    total_pages = Math.ceil(items.length / per_page);

  return {
    page: page,
    per_page: per_page,
    prev_page: page - 1 ? page - 1 : null,
    next_page: total_pages > page ? page + 1 : null,
    total: items.length,
    total_pages: total_pages,
    data: paginatedItems,
  };
};
