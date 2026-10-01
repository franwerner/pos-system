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
| `/admin/products` | Catálogo de venta, su margen objetivo y la composición que descuenta stock | Editar la composición la reemplaza entera (borra y reinserta). El margen objetivo vacío deja al producto sin precio sugerido. El preview muestra 3 números (cuesta hacerlo, te queda por plato, precio sugerido) y una alerta si el precio quedó por debajo del sugerido; un switch "Ver detalle" abre el desglose por línea y por tipo de pérdida |
| `/admin/supplies` | Insumos: ingredientes, packaging, bebidas y preparados | "Crear producto desde insumo" arma el producto y su composición de una línea |
| `/admin/stock` | Existencias, alertas de mínimo, historial y ajustes | Pérdida y ajuste se valúan al costo del insumo al registrarse |
| `/admin/purchases` | Ingreso de mercadería | **Actualiza `supply.purchase_price`**: repercute en el costeo de todos los productos que usen ese insumo |
| `/admin/production` | Producción de preparados | Genera salida de componentes y entrada del preparado, y persiste su costo unitario |
| `/admin/fixed-costs` | Conceptos del mes elegido, su total y cuánto hay que vender para cubrirlos (punto de equilibrio) | Lee `/api/costing` para el margen promedio de la carta. El costo fijo ya no se reparte por plato: se ve una sola vez, acá, a nivel local |
| `/admin/payment-methods` ("Tarifas") | El recargo o descuento al cliente de cada medio de pago | Negativo es descuento, positivo es recargo; no hay borrado, se desactiva. No entra al costeo: es una condición de venta, no de costo (ver `costeo.md`) |
| `/admin/settings` | Los tres porcentajes de pérdidas por tipo de insumo, con la pérdida medida del mes de ese tipo | `PATCH /api/config` afecta todo el costeo. Lo medido se muestra al lado de cada declarado con su botón para adoptarlo, y no entra al cálculo hasta que se adopta. El empleado y el medio de pago por defecto siguen en `app_config` y los sigue usando el sistema, pero ya no se editan desde ninguna pantalla |
| `/admin/cash` | Apertura, ingresos y egresos, cierre con arqueo e historial | El arqueo se arma desde los **pagos**, no desde la venta, por el reparto entre medios |

---

## El costeo, sin pantalla propia

La pantalla `/admin/costing` se sacó del panel: hay que rehacerla. El cálculo sigue entero y en
uso — `GET /api/costing` (el reporte completo del mes), `GET /api/costing/context` (solo los
parámetros) y `GET /api/costing/measured` (la pérdida medida), con sus servicios puros en
`src/features/costing/services/` y sus tests de flujo. Lo que se ve hoy del costeo es el
**preview en vivo del formulario del producto**, que costea con esos mismos servicios contra
`/api/costing/context`.

El reporte no escribe nada y no tiene tabla propia: se recalcula entero en cada request, con los
precios de hoy. No hay historia de costos, y no hace falta: el precio sugerido no depende de
ventas pasadas ni de meses cerrados, solo de la receta y el margen objetivo del producto.

Lo que entra al cálculo:

| Tabla | Para qué |
|---|---|
| `product` + `product_supply` + `supply` | los productos, su margen objetivo y su receta, con precio de compra y rendimiento |
| `production` | costo de los insumos preparados, de su última producción |
| `app_config` | pérdidas declaradas por tipo de insumo |
| `stock_movement` | la pérdida medida del período, por tipo de insumo (indicador, no entra al cálculo) |

Impuestos, comisiones de medios de pago y costo fijo por plato quedan fuera del costeo por ahora
(ver [`PLAN/02`](../PLAN/02-impuestos.md) y [`PLAN/03`](../PLAN/03-medios-de-pago.md)): el margen
objetivo que carga cada producto tiene que cubrirlos. La tabla `tax` y la columna
`payment_method.expected_share` siguen en la base, sin que ningún código las lea (ver
[`PLAN/06`](../PLAN/06-datos.md)). El costo fijo se ve una sola vez, a nivel local, como punto de
equilibrio (`/admin/fixed-costs`, ver [`flows/fixed-costs.md`](flows/fixed-costs.md)) — el reporte
de costeo no lo necesita para nada.

---

## Paginación pendiente

PostgREST corta en 1000 filas y hoy ninguna lectura de colección pagina. El corte es
**silencioso**: no falla, devuelve de menos.

**Lo que rompía antes, y este plan resolvió de paso**: `costing-context.ts` leía toda la
historia de `sale_item` para repartir los costos fijos por plato. Ese reparto se eliminó entero
(ver [`PLAN/01`](../PLAN/01-modelo-de-costo.md) y [`PLAN/04`](../PLAN/04-costos-fijos.md)): el
costeo ya no lee `sale_item` en absoluto, así que ese riesgo desapareció con el código que lo
causaba.

**Lo que sigue pendiente**, por orden de exposición: el historial de pedidos
(`order.repository.ts`), los movimientos de stock, el historial de cajas con sus pagos
anidados, y la consulta de pérdida medida del mes (`stock_movement`, acotada al mes pero sin
límite de filas).

**Aparte**, `fetchLastProductionCosts` trae todas las producciones de un insumo para
quedarse con la última: conviene resolverlo con una consulta por insumo o una vista.

El resto —productos, insumos, categorías y medios de pago— está acotado por el tamaño del
catálogo y no es urgente.
