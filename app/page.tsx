import Link from "next/link";
import Image from "next/image";
import styles from "./landing.module.css";

export default function Home() {
    return (
        <main className={styles.container}>
            <div className={styles.wrapper}>

                <header className={styles.header}>
                    <div className={styles.brand}>
                        <Image
                            src="/kordex-logo.png"
                            alt="Kordex"
                            width={852}
                            height={210}
                            className={styles.logo}
                            priority
                        />
                    </div>

                    <nav className={styles.nav}>
                        <Link href="/iniciar-sesion">
                            Iniciar sesión
                        </Link>

                        <Link href="/registro">
                            Crear cuenta
                        </Link>
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

                            <Link
                                href="/iniciar-sesion"
                                className={styles.secondaryButton}
                            >
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
        </main>
    );
}