create database cup26_database;
use cup26_database;

SET default_storage_engine=InnoDB;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `comentarios`, `inventario_usuarios`, `premios_virtuales`, `votos`, `opciones`, `publicaciones`, `usuarios`;

CREATE TABLE `usuarios` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `nombre_usuario` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `fan_coins` INT NOT NULL DEFAULT 0,
  `foto_perfil_url` VARCHAR(512) DEFAULT 'https://example.com/default-avatar.png',
  `foto_portada_url` VARCHAR(512) NULL,
  `fecha_registro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `nombre_usuario_UNIQUE` (`nombre_usuario` ASC),
  UNIQUE INDEX `email_UNIQUE` (`email` ASC)
) COMMENT = 'Tabla para almacenar los usuarios de la aplicación';

CREATE TABLE `publicaciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_id` BIGINT NOT NULL,
  `texto_pregunta` TEXT NOT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_publicaciones_usuarios_idx` (`usuario_id` ASC),
  CONSTRAINT `fk_publicaciones_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) COMMENT = 'Almacena las preguntas de las encuestas/trivias';

CREATE TABLE `opciones` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `publicacion_id` BIGINT NOT NULL,
  `texto_opcion` VARCHAR(255) NOT NULL,
  `es_correcta` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`),
  INDEX `fk_opciones_publicaciones_idx` (`publicacion_id` ASC),
  CONSTRAINT `fk_opciones_publicaciones`
    FOREIGN KEY (`publicacion_id`)
    REFERENCES `publicaciones` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) COMMENT = 'Almacena las posibles respuestas para cada publicación';

CREATE TABLE `votos` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_id` BIGINT NOT NULL,
  `opcion_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `fk_votos_usuarios_idx` (`usuario_id` ASC),
  INDEX `fk_votos_opciones_idx` (`opcion_id` ASC),
  UNIQUE INDEX `usuario_opcion_UNIQUE` (`usuario_id` ASC, `opcion_id` ASC),
  CONSTRAINT `fk_votos_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_votos_opciones`
    FOREIGN KEY (`opcion_id`)
    REFERENCES `opciones` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) COMMENT = 'Registra los votos de los usuarios en las opciones';

CREATE TABLE `premios_virtuales` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre_premio` VARCHAR(100) NOT NULL,
  `tipo_premio` ENUM('BORDE_PERFIL', 'INSIGNIA', 'TEMA_PERFIL') NOT NULL,
  `imagen_preview_url` VARCHAR(512) NOT NULL,
  `costo_en_fancoins` INT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `nombre_premio_UNIQUE` (`nombre_premio` ASC)
) COMMENT = 'Tabla maestra con la lista de premios virtuales disponibles';


CREATE TABLE `inventario_usuarios` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `usuario_id` BIGINT NOT NULL,
  `premio_id` INT NOT NULL,
  `fecha_adquisicion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_inventario_usuarios_idx` (`usuario_id` ASC),
  INDEX `fk_inventario_premios_idx` (`premio_id` ASC),
  UNIQUE INDEX `usuario_premio_UNIQUE` (`usuario_id` ASC, `premio_id` ASC),
  CONSTRAINT `fk_inventario_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_inventario_premios`
    FOREIGN KEY (`premio_id`)
    REFERENCES `premios_virtuales` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) COMMENT = 'Registra los premios que cada usuario ha adquirido';


CREATE TABLE `comentarios` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `publicacion_id` BIGINT NOT NULL,
  `usuario_id` BIGINT NOT NULL,
  `texto_comentario` TEXT NOT NULL,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `fk_comentarios_publicaciones_idx` (`publicacion_id` ASC),
  INDEX `fk_comentarios_usuarios_idx` (`usuario_id` ASC),
  CONSTRAINT `fk_comentarios_publicaciones`
    FOREIGN KEY (`publicacion_id`)
    REFERENCES `publicaciones` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comentarios_usuarios`
    FOREIGN KEY (`usuario_id`)
    REFERENCES `usuarios` (`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) COMMENT = 'Tabla para los comentarios en las publicaciones';