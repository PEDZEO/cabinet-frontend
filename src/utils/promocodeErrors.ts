type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string | { message?: string; code?: string };
      message?: string;
      code?: string;
    };
  };
};

const stringifyDetail = (detail: unknown): string => {
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    const asObj = detail as { message?: unknown; code?: unknown };
    if (typeof asObj.code === 'string') return asObj.code;
    if (typeof asObj.message === 'string') return asObj.message;
  }
  return '';
};

export const getPromocodeErrorKey = (error: unknown): string => {
  const apiError = error as ApiErrorShape;
  const rawDetail =
    stringifyDetail(apiError.response?.data?.detail) ||
    (typeof apiError.response?.data?.message === 'string' ? apiError.response.data.message : '') ||
    (typeof apiError.response?.data?.code === 'string' ? apiError.response.data.code : '') ||
    'server_error';

  const detail = rawDetail.toLowerCase();

  if (detail.includes('not found')) return 'not_found';
  if (detail.includes('expired')) return 'expired';
  if (detail.includes('fully used') || detail === 'used') return 'used';
  if (
    detail.includes('already used') ||
    detail.includes('already activated') ||
    detail.includes('cannot be activated') ||
    detail.includes('own gift') ||
    detail.includes('already_used_by_user')
  ) {
    return 'already_used_by_user';
  }

  return 'server_error';
};
