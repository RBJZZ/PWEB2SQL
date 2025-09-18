DROP TABLE IF EXISTS comentarios, inventario_usuarios, premios_virtuales, votos, opciones, publicaciones, usuarios CASCADE;
DROP TYPE IF EXISTS tipo_de_premio;

CREATE TYPE tipo_de_premio AS ENUM ('BORDE_PERFIL', 'INSIGNIA', 'TEMA_PERFIL');

CREATE TABLE usuarios (
    id BIGSERIAL PRIMARY KEY,
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fan_coins INT NOT NULL DEFAULT 0 CHECK (fan_coins >= 0),
    foto_perfil_url VARCHAR(512) DEFAULT 'https://static.vecteezy.com/system/resources/previews/009/292/244/non_2x/default-avatar-icon-of-social-media-user-vector.jpg',
    foto_portada_url VARCHAR(512),
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE publicaciones (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    texto_pregunta TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE opciones (
    id BIGSERIAL PRIMARY KEY,
    publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    texto_opcion VARCHAR(255) NOT NULL,
    es_correcta BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE votos (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    opcion_id BIGINT NOT NULL REFERENCES opciones(id) ON DELETE CASCADE,
    UNIQUE (usuario_id, opcion_id)
);

CREATE TABLE premios_virtuales (
    id SERIAL PRIMARY KEY,
    nombre_premio VARCHAR(100) UNIQUE NOT NULL,
    tipo_premio tipo_de_premio NOT NULL,
    imagen_preview_url VARCHAR(512) NOT NULL,
    costo_en_fancoins INT NOT NULL CHECK (costo_en_fancoins > 0)
);

CREATE TABLE inventario_usuarios (
    id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    premio_id INT NOT NULL REFERENCES premios_virtuales(id) ON DELETE CASCADE,
    fecha_adquisicion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (usuario_id, premio_id)
);

CREATE TABLE comentarios (
    id BIGSERIAL PRIMARY KEY,
    publicacion_id BIGINT NOT NULL REFERENCES publicaciones(id) ON DELETE CASCADE,
    usuario_id BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    texto_comentario TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_publicaciones_usuario_id ON publicaciones(usuario_id);
CREATE INDEX idx_opciones_publicacion_id ON opciones(publicacion_id);
CREATE INDEX idx_votos_usuario_id ON votos(usuario_id);
CREATE INDEX idx_votos_opcion_id ON votos(opcion_id);
