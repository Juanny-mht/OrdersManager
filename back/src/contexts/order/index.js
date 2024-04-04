const { Router } = require("express");
const { client } = require("../../infrastructure/database/database");

const router = Router();

const urlStock = "http://localhost:3002/api";

//get all orders
router.get("/", async (req, res) => {
    const orders = await client.order.findMany();
    res.status(200).json(orders);
});

//get an order by id
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    const order = await client.order.findUnique({
        where: {
            id: id
        }
    });
    res.status(200).json(order);
});



//post one or more orders
router.post("/", async (req, res) => {
    const {articles, status} = req.body;
    let totalPrice = 0.0;  
    let listOrder = [];
    // console.log(articles);
    // console.log(status);

    let fetchPromises = [];
    let count = 0;
    let price = 0.0;
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const articleId = article.id;
        const size = article.size;
 


        const response = fetch(`${urlStock}/stocks/${articleId}`).then(response => response.json()).then(data => {
            //on parcourt le json pour trouver le count qui correspond à la size
            //on vérifie si le count est suffisant
            //si le count est suffisant, on crée la commande
            //sinon on renvoie une erreur
            for (stock of data.stocks) {
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
        // console.log("totalPrice avant await:");
        // console.log(listOrder);
        fetchPromises.push(response);

    }
    
    await Promise.all(fetchPromises);
    // console.log("totalPrice après await:");
    // console.log(listOrder);
    
    const order = await client.order.create({
        data: {
            totalprice: totalPrice,
            status: status,
            articles: JSON.stringify(listOrder)
        }
    });
    console.log(order);
    res.status(201).json(order);
});

// delete an order by id
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const order = await client.order.delete({
        where: {
            id: parseInt(id)
        }
    });
    res.status(200).json(order);
});

//delete all orders
router.delete("/", async (req, res) => {
    const orders = await client.order.deleteMany();
    res.status(200).json(orders);
});


//modify an order if the status is 'in progress' else return an error
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { articles, status } = req.body;
    let totalPrice = 0.0;
    let listOrder = [];
    let fetchPromises = [];
    let count = 0;
    let price = 0.0;

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
                    for (stock of data.stocks) {
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
            res.status(200).json(order);
        }else {
            res.status(400).json({message: "You can't modify this order. The order is completed or canceled."});
        }
    }

});


module.exports = router;