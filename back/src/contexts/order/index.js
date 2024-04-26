const { Router } = require("express");
const { client } = require("../../infrastructure/database/database");
const validateMessage = require("../../validateMessageMiddleware");

const router = Router();

const urlStock = "http://localhost:3002/api";

/** 
 * @swagger
 * /api/orders:
 * get:
 * description: Get all orders
 * responses:
 * 200:
 * description: Success
 * 500:
 * description: Internal Server Error
 */
router.get("/", async (req, res) => {
    const orders = await client.order.findMany();

    for (let i = 0; i < orders.length; i++) {
        orders[i].createdAt = orders[i].createdAt.toISOString();
    }

    try {
        validateMessage('ordersResponse', orders, () => {
            console.log('Response is valid');
        });
    } catch (error) {
        res.status(500).send();
        console.log(error.message);
        return;
    }

    res.status(200).json(orders);
});

/**
 * @swagger
 * /api/orders/{id}:
 * get:
 * description: Get an order by id
 * parameters:
 * - name: id
 *  in: path
 * required: true
 * type: string
 * responses:
 * 200:
 * description: Success
 * 500:
 * description: Internal Server Error
 */
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const order = await client.order.findUnique({
        where: {
            id: id
        }
    });
    order.createdAt = order.createdAt.toISOString();
    try {
        validateMessage('orderResponse', order, () => {
            console.log('Response is valid');
        }
        );} catch (error) {
        res.status(500).send();
        console.log(error.message);
        return;
    }
    res.status(200).json(order);
});

/**
 * @swagger
 * /api/orders:
 * post:
 * description: Create one or more orders
 * requestBody:
 * required: true
 * content:
 * application/json:  #ref to the schema in OrdersManager.json file
 * responses:
 * 201:
 * description: Created
 * 400:
 * description: Bad Request
 * 500:
 * description: Internal Server Error
 */
router.post("/", async (req, res) => {
    const {articles, status} = req.body;
    let totalPrice = 0.0;  
    let listOrder = [];
    // Validation du message
    try {
        validateMessage('orders', req.body, () => {
            console.log('Body is valid');
        });
    } catch (error) {
        res.status(400).send();
        console.log(error.message);
        return;
    }
    let fetchPromises = [];
    let count = 0;
    let price = 0.0;
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const articleId = article.id;
        const size = article.size; 
        try {
        const response = fetch(`${urlStock}/stocks/${articleId}`).then(response => response.json()).then(data => {
            //on parcourt le json pour trouver le count qui correspond à la size
            //on vérifie si le count est suffisant
            //si le count est suffisant, on crée la commande
            //sinon on renvoie une erreur
            for (stock of data) {
                //console.log(stock);
                if (stock.size === size) {
                    count = stock.count;
                    price = stock.price;
                }
            }
            if (count > 0) {
                totalPrice += price;
                console.log(totalPrice);

                //on appelle l'api de stock pour décrémenter le stock
                fetch(`${urlStock}/stocks/${articleId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({size: size, count: count - 1})
                }).then(response => response.json()).then(data => {
                    //console.log(data);
                });
                listOrder.push(article);
            }
            
        });
        fetchPromises.push(response);
        }catch (error) {
            res.status(500).send();
            return;
        }
    }
    await Promise.all(fetchPromises);
    

    const order = await client.order.create({
        data: {
            totalprice: totalPrice,
            status: status,
            articles: JSON.stringify(listOrder)
        }
    });
    order.createdAt = order.createdAt.toISOString();

    // Validation du message de réponse
    try {
        validateMessage('orderResponse', order, () => {
            console.log('Response is valid');
        });
    } catch (error) {
        res.status(500).send();
        return;
    }

    res.status(201).json(order);
});

/**
 * @swagger 
 * /api/orders/{id}:
 * delete:
 * description: Delete an order by id
 * parameters:
 * - name: id
 * in: path
 * required: true
 * type: string
 * responses:
 * 200:
 * description: Success
 * 400:
 * description: Error : Order not found
 */
router.delete("/:id", async (req, res) => {

    const { id } = req.params;
    try {
    const order = await client.order.delete({
        where: {
            id: id
        }
    });} catch (error) {
        res.status(400).send("Error : Order not found" );
        return;
    }
    res.status(200);
});

/**
 * @swagger
 * /api/orders:
 * delete:
 * description: Delete all orders
 * responses:
 * 200:
 * description: Success
 * 500:
 * description: Internal Server Error
 */
router.delete("/", async (req, res) => {
    try {
        const orders = await client.order.deleteMany();
    }catch(error) {
        res.status(500).send();
    }
    res.status(200).send();
});

/**
 * @swagger
 * /api/orders/{id}:
 * put:
 * description: Modify an order by id
 * parameters:
 * - name: id
 * in: path
 * required: true
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:  #ref to the schema in OrdersManager.json file
 * responses:
 * 200:
 * description: Success
 * 400:
 * description: Error : You can't modify this order. The order is completed or canceled.
 * 500:
 * description: Internal Server Error
 */
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { articles, status } = req.body;
    let totalPrice = 0.0;
    let listOrder = [];
    let fetchPromises = [];
    let count = 0;
    let price = 0.0;

    // Validation du message
    try {
        validateMessage('orders', req.body, () => {
            console.log('Body is valid');
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
        return;
    }

    const order = await client.order.findUnique({
        where: {
            id: id 
        }
    });

    if (articles === undefined) {
        //on modifie juste le status
        const order = await client.order.update({
            where: {
                id: id
            },
            data: {
                status: status
            }
        });
        res.status(200).json(order);
    }else{
        if ((order.status).toLowerCase() === 'in progress') {
            for (let i = 0; i < articles.length; i++) {
                const article = articles[i];
                const articleId = article.id;
                const size = article.size;
                const response = fetch(`${urlStock}/stocks/${articleId}`).then(response => response.json()).then(data => {
                    for (stock of data) {
                        if (stock.size === size) {
                            count = stock.count;
                            price = stock.price;
                        }
                    }
                    if (count > 0) {
                        totalPrice += price;
                        fetch(`${urlStock}/stocks/${articleId}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({size: size, count: count - 1})
                        }).then(response => response.json()).then(data => {
                            //console.log(data);
                        });
                        listOrder.push(article);
                    }
                });
                fetchPromises.push(response);
            }
            await Promise.all(fetchPromises);
            const order = await client.order.update({
                where: {
                    id: id
                },
                data: {
                    totalprice: totalPrice,
                    status: status,
                    articles: JSON.stringify(listOrder)
                }
            });
            // Validation du message de réponse
            order.createdAt = order.createdAt.toISOString();
            try {
                validateMessage('orderResponse', order, () => {
                    console.log('Response is valid');
                });
            } catch (error) {
                res.status(400).json({ message: error.message });
                return;
            }

            res.status(200).json(order);
        }else {
            res.status(400).json({message: "You can't modify this order. The order is completed or canceled."});
        }
    }

});

module.exports = router;