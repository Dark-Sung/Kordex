import Link from "next/link";
import KordexLogo from "@/components/KordexLogo";
import styles from "./landing.module.css";

export default function Home() {
    return (
        <main className={styles.container}>
            <div className={styles.wrapper}>

                <header className={styles.header}>
                    <div className={styles.brand}>
                        <KordexLogo className={styles.logo} priority />
                    </div>

                           <nav className={styles.nav}>
                            <Link href="#tipos-inventario">Tipos de inventario</Link>

                             <Link href="#funciones">Funciones</Link>

                             <Link href="#mantenimiento">Mantenimiento</Link>

                            <Link href="#equipo">Equipo y roles</Link>

                             <Link href="/iniciar-sesion">Iniciar sesión</Link>
                         </nav>
                </header>

                <section className={styles.hero}>
                    <div>
                        <p className={styles.eyebrow}>
                            — INVENTARIO PARA VARIAS EMPRESAS
                        </p>

                        <h1>
                            Sabe qué tiene,<br />
                            dónde está y qué<br />
                            hay que reponer.
                        </h1>

                        <p className={styles.description}>
                            Kordex lleva el inventario de tu tienda
                            o de los elementos de trabajo de tu
                            organización. Stock, variantes,
                            mantenimiento y equipo en un solo
                            lugar, sin instalar ni configurar
                            un servidor de base de datos.
                        </p>

                        <div className={styles.actions}>
                            <Link
                                href="/registro"
                                className={styles.primaryButton}
                            >
                                Crear cuenta
                            </Link>

                            <Link href="/iniciar-sesion" className={styles.secondaryButton}>
                              Iniciar sesión
                            </Link>
                        </div>

                        <p className={styles.note}>
                            Precios en pesos colombianos (COP)
                            y fechas en hora de Bogotá.
                        </p>
                    </div>

                    <div className={styles.preview}>
                        <div className={styles.previewHeader}>
                            <strong>Ferretería La Esquina</strong>
                            <small>Tienda · Datos de ejemplo</small>
                        </div>

                        <div className={styles.previewBody}>
                            <div className={styles.stats}>
                                <div className={styles.stat}>
                                    <span>Valor del inventario</span>
                                    <strong>$18.742.300</strong>
                                </div>

                                <div className={styles.stat}>
                                    <span>Por reponer</span>
                                    <strong className={styles.warning}>
                                        3 productos
                                    </strong>
                                </div>
                            </div>

                            <p className={styles.previewLabel}>
                                POR REPONER
                            </p>

                            <div className={styles.product}>
                                <div>
                                    <strong>
                                        Tornillo drywall 1¼&quot; (caja x100)
                                    </strong>
                                    <small>FER-0310</small>
                                </div>

                                <div className={styles.stock}>
                                    2 / mín. 10
                                    <div className={styles.progress}>
                                        <span style={{
                                            width: "20%",
                                            background: "#b3392f"
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.product}>
                                <div>
                                    <strong>
                                        Taladro percutor 13 mm
                                    </strong>
                                    <small>FER-0142</small>
                                </div>

                                <div className={styles.stock}>
                                    3 / mín. 5
                                    <div className={styles.progress}>
                                        <span style={{
                                            width: "60%"
                                        }} />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.product}>
                                <div>
                                    <strong>
                                        Cinta aislante negra 18 m
                                    </strong>
                                    <small>FER-0087</small>
                                </div>

                                <div className={styles.stock}>
                                    8 / mín. 20
                                    <div className={styles.progress}>
                                        <span style={{
                                            width: "40%"
                                        }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* TIPOS DE INVENTARIO */}

            <section
                id="tipos-inventario"
                className={styles.inventorySection}
            >
                <div className={styles.wrapper}>

                    <h2 className={styles.sectionTitle}>
                        Dos tipos de inventario, cada<br />
                        uno con sus propios campos
                    </h2>

                    <p className={styles.sectionDescription}>
                        Al registrar la empresa eliges el tipo.
                        La pantalla de resumen, los campos y el
                        historial se adaptan a lo que realmente
                        necesitas.
                    </p>

                    <div className={styles.inventoryGrid}>

                        <article className={styles.storeCard}>
                            <p className={styles.cardLabel}>
                                TIENDA
                            </p>

                            <h3>
                                Para negocios que venden productos
                            </h3>

                            <p>
                                Controla costo, precio de venta y
                                stock mínimo, y recibe la lista
                                de lo que toca reponer.
                            </p>

                            <ul>
                                <li>
                                    SKU, costo, precio, stock y stock mínimo
                                </li>
                                <li>
                                    Valor total del inventario en el resumen
                                </li>
                                <li>
                                    Lista «Por reponer» según el mínimo
                                    de cada producto
                                </li>
                                <li>
                                    Movimientos: entradas, salidas y ajustes,
                                    con quién los registró
                                </li>
                            </ul>
                        </article>

                        <article className={styles.organizationCard}>
                            <p className={styles.cardLabel}>
                                ORGANIZACIÓN
                            </p>

                            <h3>
                                Para equipos con elementos de trabajo
                            </h3>

                            <p>
                                Fundaciones, colegios, laboratorios
                                o equipos que inventarían equipos y
                                herramientas, sin precios ni ventas.
                            </p>

                            <ul>
                                <li>
                                    Código, cantidad, estado,
                                    responsable y serial
                                </li>
                                <li>
                                    Ubicación y notas de cada elemento
                                </li>
                                <li>
                                    Lista «Requieren atención» en el resumen
                                </li>
                                <li>
                                    Mantenimiento periódico e historial
                                    de cambios
                                </li>
                            </ul>
                        </article>

                    </div>
                </div>
            </section>
            <section id="funciones" className={styles.featuresSection}>
    <div className={styles.wrapper}>

        <h2 className={styles.sectionTitle}>
            Lo que necesitas para<br />
            llevar el control día a día
        </h2>

        <div className={styles.featuresGrid}>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>VARIANTES</p>
                <h3>Un producto, muchas versiones</h3>
                <p>
                    Agrega variantes de distinta marca y modelo
                    a un mismo registro, por ejemplo varios
                    televisores bajo «Televisor». El principal
                    suma el total de sus variantes.
                </p>
            </article>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>ALERTAS</p>
                <h3>Lo urgente aparece primero</h3>
                <p>
                    Las tiendas ven «Por reponer» y las
                    organizaciones ven «Requieren atención»,
                    calculado sobre cada variante.
                </p>
            </article>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>HISTORIAL</p>
                <h3>Cada cambio queda registrado</h3>
                <p>
                    Movimientos de entrada, salida y ajuste,
                    o cambios de un elemento, siempre con
                    quién lo hizo y cuándo.
                </p>
            </article>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>FOTOS</p>
                <h3>Reconoce cada elemento</h3>
                <p>
                    Sube una foto JPG, PNG o WebP de hasta
                    4 MB con vista previa, y cámbiala o
                    quítala cuando quieras.
                </p>
            </article>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>BÚSQUEDA</p>
                <h3>Encuentra y filtra rápido</h3>
                <p>
                    Busca por nombre o código, filtra por
                    categoría y organiza tu catálogo con
                    tus propias categorías.
                </p>
            </article>

            <article className={styles.featureCard}>
                <p className={styles.featureLabel}>EXPORTAR</p>
                <h3>Tus datos, en CSV</h3>
                <p>
                    Descarga todo el inventario con un clic
                    para llevarlo a una hoja de cálculo
                    o respaldarlo.
                </p>
            </article>

        </div>
    </div>
</section>
<section id="mantenimiento" className={styles.maintenanceSection}>
    <div className={styles.wrapper}>
        <div className={styles.maintenanceGrid}>

            <div className={styles.maintenanceInfo}>
                <p className={styles.maintenanceLabel}>
                    TIPO ORGANIZACIÓN
                </p>

                <h2>
                    El mantenimiento deja de depender de la memoria
                </h2>

                <p>
                    Define cada cuánto necesita mantenimiento
                    un elemento: cada semana, mes, 3 o 6 meses,
                    año, o un número de días propio. Kordex
                    ordena el plan por urgencia y reinicia el
                    conteo cuando lo confirmas.
                </p>

                <p>
                    Además, cada vez que cambias el estado,
                    el responsable o la ubicación de un elemento,
                    el historial anota qué cambió y de qué valor
                    a cuál.
                </p>
            </div>

            <div className={styles.maintenanceCard}>

                <p className={styles.maintenanceCardTitle}>
                    PLAN DE MANTENIMIENTO · DATOS DE EJEMPLO
                </p>

                <div className={styles.maintenanceRow}>
                    <div>
                        <strong>Extintor multipropósito</strong>
                        <small>Bodega · Cada 6 meses</small>
                    </div>

                    <div className={styles.maintenanceActions}>
                        <span className={styles.overdue}>
                            Vencido
                        </span>
                        <span className={styles.doneButton}>
                            Marcar hecho
                        </span>
                    </div>
                </div>

                <div className={styles.maintenanceRow}>
                    <div>
                        <strong>Proyector portátil</strong>
                        <small>Sala de reuniones · Cada 3 meses</small>
                    </div>

                    <div className={styles.maintenanceActions}>
                        <span className={styles.upcoming}>
                            Próximo
                        </span>
                        <span className={styles.doneButton}>
                            Marcar hecho
                        </span>
                    </div>
                </div>

                <div className={styles.maintenanceRow}>
                    <div>
                        <strong>Impresora láser</strong>
                        <small>Oficina · Cada mes</small>
                    </div>

                    <div className={styles.maintenanceActions}>
                        <span className={styles.upcoming}>
                            Próximo
                        </span>
                        <span className={styles.doneButton}>
                            Marcar hecho
                        </span>
                    </div>
                </div>

                <div className={styles.maintenanceRow}>
                    <div>
                        <strong>Router principal</strong>
                        <small>Oficina · Cada año</small>
                    </div>

                    <div className={styles.maintenanceActions}>
                        <span className={styles.upToDate}>
                            Al día
                        </span>
                        <span className={styles.doneButton}>
                            Marcar hecho
                        </span>
                    </div>
                </div>

            </div>
        </div>
    </div>
</section>
         <section id="equipo" className={styles.teamSection}>
    <div className={styles.wrapper}>
        <div className={styles.teamGrid}>

            <div className={styles.teamInfo}>
                <h2 className={styles.sectionTitle}>
                    Una cuenta, varias empresas, cada persona con su rol
                </h2>

                <p>
                    Una misma cuenta puede pertenecer a varias
                    empresas con un rol distinto en cada una.
                    Agregas a tu equipo con el correo de su cuenta.
                </p>

                <ul>
                    <li>
                        Contraseñas protegidas con scrypt y
                        sesión en cookie httpOnly.
                    </li>

                    <li>
                        Bloqueo de 15 minutos tras 5 intentos
                        fallidos con un mismo correo.
                    </li>

                    <li>
                        Permisos revisados en el servidor,
                        no solo ocultos en pantalla.
                    </li>

                    <li>
                        Fotos visibles únicamente para las
                        personas de esa empresa.
                    </li>
                </ul>
            </div>

            <div className={styles.rolesTable}>

                <div className={styles.roleRow}>
                    <h3>Propietario</h3>
                    <p>
                        Control total: equipo, ajustes de
                        la empresa y eliminarla.
                    </p>
                </div>

                <div className={styles.roleRow}>
                    <h3>Administrador</h3>
                    <p>
                        Gestiona inventario, categorías y
                        el equipo (operadores y consulta).
                    </p>
                </div>

                <div className={styles.roleRow}>
                    <h3>Operador</h3>
                    <p>
                        Crea y edita registros, anota movimientos
                        y confirma mantenimientos. No elimina.
                    </p>
                </div>

                <div className={styles.roleRow}>
                    <h3>Solo consulta</h3>
                    <p>
                        Ve el inventario y descarga el CSV,
                        sin poder modificar nada.
                    </p>
                </div>

            </div>
        </div>
    </div>
</section>
      <section className={styles.ctaSection}>
    <div className={styles.wrapper}>
        <div className={styles.ctaCard}>

            <div className={styles.ctaInfo}>
                <h2>Empieza con tu primer inventario</h2>

                <p>
                    Crea tu cuenta, registra tu empresa y elige
                    si es una tienda o una organización.
                </p>
            </div>

            <div className={styles.ctaActions}>
                <Link
                    href="/registro"
                    className={styles.ctaPrimary}
                >
                    Crear cuenta
                </Link>

                <Link
                    href="/iniciar-sesion"
                    className={styles.ctaSecondary}
                >
                    Iniciar sesión
                </Link>
            </div>

        </div>
    </div>
</section>

<footer className={styles.footer}>
    <div className={styles.wrapper}>
        <div className={styles.footerContent}>
            <strong>Kordex</strong>

            <p>
                Control de inventario para tiendas y organizaciones.
            </p>
        </div>
    </div>
</footer>
        </main>
    );
}
