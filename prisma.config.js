const { defineConfig } = require('@prisma/config');

module.exports = defineConfig({
    schema: './schema.prisma',
    datasource: {
        url: 'file:./dev.db',
    },
});