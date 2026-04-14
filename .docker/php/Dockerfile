FROM php:8.4-fpm-alpine

RUN apk add --no-cache \
    icu-dev \
    libzip-dev \
    postgresql-dev \
    oniguruma-dev \
    linux-headers \
    $PHPIZE_DEPS \
    && docker-php-ext-install -j$(nproc) \
    intl \
    mbstring \
    opcache \
    pdo_pgsql \
    zip \
    bcmath \
    && apk del $PHPIZE_DEPS linux-headers

# phpredis (optional if REDIS_CLIENT=phpredis; predis in Composer does not register the "Redis" class)
RUN apk add --no-cache --virtual .redis-build-deps $PHPIZE_DEPS linux-headers \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del .redis-build-deps

RUN apk add --no-cache supervisor

COPY .docker/php/php.ini /usr/local/etc/php/conf.d/99-custom.ini
COPY .docker/php/supervisor/supervisord.conf /etc/supervisord.conf

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www/html

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
