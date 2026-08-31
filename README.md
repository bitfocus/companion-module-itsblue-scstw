# companion-module-itsblue-scstw

onnects Companion directly to the itsblue.de speedclimbing stopwatch (ScStw) over its binary WebSocket API.

## Setup

Connect the Companion computer to the stopwatch Ethernet network. The default address is `10.4.99.1`; normally no configuration change is needed.

The **Starter – 2×3 layout** preset group is ordered for a Stream Deck Mini:

| Lane A upper | Lane B upper |
| --- | --- |
| Lane A lower | Lane B lower |
| Secondary control | Primary / Ready |

For an enabled lane, its display is on the upper row and its Disable/Fall control is on the lower row. When a lane is disabled, the two flip: Enable moves to the upper row and the read-only `OFF` display moves to the lower row. The action behavior flips with the labels, preventing an accidental press on `OFF` from enabling the lane.

The primary control and a lane's Fall command require two presses within three seconds, matching the confirmation behavior of the starter web interface. The starter primary control deliberately does not reset a finished race. Use the separate **Reset race** action on a custom button when reset control is wanted.

The connection uses `ws://10.4.99.1/api/v1/ws` with the required `ws-v1.proto.scstw.itsblue.de` subprotocol. Commands are never replayed after a reconnect.

