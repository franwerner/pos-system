# Mapa de vistas

Qué muestra cada pantalla, de dónde saca los datos y qué escribe.

Todas las rutas de `/pos`, `/admin` y `/api` pasan por `src/middleware.ts`: sin cookie de
sesión válida, las páginas redirigen a `/login` y la API responde 401. Ningún archivo del
navegador toca la base: toda lectura y escritura pasa por `/api/*`, que usa la clave secreta
del servidor.

---

## POS

### `/pos` — pantalla de venta
Catálogo por categoría, buscador, carrito, estado de la caja y acceso a los pendientes.

- **Lee**: `/api/products` (`product` + `category`), `/api/categories`, `/api/cash-sessions?status=open`, `/api/orders?status=pending` (para el contador).
- **Escribe**: nada. El carrito vive en `localStorage` y en memoria.
- Los totales del carrito se calculan al vuelo.

### `/pos/checkout` — cierre del pedido
Cobrar ahora con reparto entre medios de pago, o dejarlo pendiente.

- **Lee**: composición de los productos del carrito, stock de esos insumos, métodos de pago activos, caja abierta.
- **Escribe** (`POST /api/orders`): `sale`, `sale_item`, `sale_payment` (solo si se cobra) y `stock_movement` tipo `sale` — **siempre**, incluso en pedidos pendientes: la comida se prepara aunque no se haya pagado.
- El precio de cada ítem lo relee el servidor del producto; nunca viene del navegador.
- Si falla un paso, un rollback manual borra lo insertado: PostgREST no da transacción.
- El aviso de stock insuficiente no bloquea y no persiste.

### `/pos/orders` — pedidos pendientes
Lo tomado y todavía no cobrado.

- **Escribe**: cobrar (`sale_payment` + update de `sale`, exige caja abierta) y cancelar (inserta movimientos de stock inversos y marca `cancelled`; no borra los originales, así queda la historia).

### `/pos/order/[orderId]` — ticket
Solo lectura, imprime con el navegador.

---

## Admin

| Pantalla | Qué hace | Efectos menos obvios |
|---|---|---|
| `/admin/products` | Catálogo de venta, su margen objetivo y la composición que descuenta stock | Editar la composición la reemplaza entera (borra y reinserta). El margen objetivo vacío deja al producto sin precio sugerido |
| `/admin/supplies` | Insumos: ingredientes, packaging, bebidas y preparados | "Crear producto desde insumo" arma el producto y su composición de una línea |
| `/admin/stock` | Existencias, alertas de mínimo, historial y ajustes | Pérdida y ajuste se valúan al costo del insumo al registrarse |
| `/admin/purchases` | Ingreso de mercadería | **Actualiza `supply.purchase_price`**: repercute en el costeo de todos los productos que usen ese insumo |
| `/admin/production` | Producción de preparados | Genera salida de componentes y entrada del preparado, y persiste su costo unitario |
| `/admin/fixed-costs` | Conceptos del mes, su total y el histórico mes a mes | Lo cargado no se reparte hasta que el mes cierre |
| `/admin/taxes` | Impuestos y en qué paso del cálculo entra cada uno | Cambiar el tipo limpia los campos del tipo anterior |
| `/admin/payment-methods` | Medios de pago y su ajuste | Negativo es descuento; no hay borrado, se desactiva |
| `/admin/settings` | Los tres porcentajes de pérdidas por tipo de insumo | `PATCH /api/config` afecta todo el costeo. El empleado y el medio de pago por defecto siguen en `app_config` y los sigue usando el sistema, pero ya no se editan desde ninguna pantalla |
| `/admin/cash` | Apertura, ingresos y egresos, cierre con arqueo e historial | El arqueo se arma desde los **pagos**, no desde la venta, por el reparto entre medios |

---

## El costeo, sin pantalla propia

La pantalla `/admin/costing` se sacó del panel: hay que rehacerla. El cálculo sigue entero y en
uso — `GET /api/costing` (el reporte completo) y `GET /api/costing/context` (solo los parámetros),
con sus servicios puros en `src/features/costing/services/` y sus tests de flujo. Lo que se ve hoy
del costeo es el **preview en vivo del formulario del producto**, que costea con esos mismos
servicios contra `/api/costing/context`.

El reporte no escribe nada y no tiene tabla propia: se recalcula entero en cada request. Lo que ves
es siempre con los precios de hoy, así que **no hay historia de costos** — el margen que dejaba un
producto el mes pasado se recalcularía con los precios actuales. Sí es reconstruible si alguna vez
hace falta, porque cada `stock_movement` de una venta guarda el costo del insumo en ese momento.

Lo que entra al cálculo:

| Tabla | Para qué |
|---|---|
| `product` + `product_supply` + `supply` | los productos, su margen objetivo y su receta, con precio de compra y rendimiento |
| `production` | costo de los insumos preparados, de su última producción |
| `app_config` | mermas por tipo |
| `tax` | impuestos activos, cada uno en su paso |
| `sale_payment` | mezcla real de medios de pago, para ponderar sus comisiones |
| `sale_item` | unidades vendidas por mes, para repartir los costos fijos |
| `fixed_cost` | los costos fijos de cada mes |
| `stock_movement` | la merma medida del período (indicador, no entra al cálculo) |

El mes en curso se excluye del reparto de fijos: está incompleto y daría un costo por unidad
enorme a principio de mes.

---

## Paginación pendiente

PostgREST corta en 1000 filas y hoy ninguna lectura de colección pagina. El corte es
**silencioso**: no falla, devuelve de menos.

**Lo que rompe primero, y peor**: `src/features/costing/server/costing-context.ts` lee toda
la historia de `sale_item` para repartir los costos fijos. Cuando pase las 1000 filas, el
costo fijo por unidad va a salir mal sin que nada avise, y eso ahora afecta el precio
sugerido.

**Después**, por orden de exposición: el historial de pedidos (`order.repository.ts`), los
movimientos de stock, el historial de cajas con sus pagos anidados, y las consultas del mes
en el costeo (`sale_item`, `sale_payment`, `stock_movement`).

**Aparte**, `fetchLastProductionCosts` trae todas las producciones de un insumo para
quedarse con la última: conviene resolverlo con una consulta por insumo o una vista.

El resto —productos, insumos, categorías, medios de pago, impuestos— está acotado por el
tamaño del catálogo y no es urgente.
