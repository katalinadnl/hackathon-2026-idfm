# syntax=docker/dockerfile:1
FROM php:8.5-fpm-alpine

RUN apk add --no-cache git unzip icu-dev libzip-dev \
    && docker-php-ext-install intl zip \
    && rm -rf /var/cache/apk/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/api

COPY api/composer.json api/composer.lock api/symfony.lock ./
RUN composer install --no-scripts --no-dev --no-interaction \
    --prefer-dist --no-progress --optimize-autoloader

COPY api/ ./

RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p var \
    && chown -R www-data:www-data var

ENV APP_ENV=prod

EXPOSE 9000
CMD ["php-fpm"]
