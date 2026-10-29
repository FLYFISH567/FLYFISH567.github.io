'use strict';
const {createHash}=require('crypto');
// 使用完整的 Hexo 永久路径计算定长标识，避免中文 URL 编码后超出 Discussions 标题长度。
hexo.extend.helper.register('ff_comment_term', page => 'page-' + createHash('sha256').update(String(page.path || '')).digest('hex'));
