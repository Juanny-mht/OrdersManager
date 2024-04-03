const { Router } = require("express");
const { client } = require("../../infrastructure/database/database");

const router = Router();

const urlStock = "http://localhost:3002/api";

//get all orders
router.get("/", async (req, res) => {
    const orders = await client.order.findMany({
    });
    res.status(200).json(orders);
});

// post an order 
// get the idArticle 
// call the api of the stock to know if the article is available
// if the article is available, create the order and add the articleId to the table articleId

router.post("/", async (req, res) => {
    const {articles} = req.body;

    console.log(articles);
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        const articleId = article.id;
        console.log(articleId);
        const price = article.price;
        const size = article.size;
        const response = await fetch(`${urlStock}/stocks/${articleId}/`);
        console.log(response);
        // const stock = await response.json();
        // if (stock.quantity >= quantity) {
        //     const order = await client.order.create({
        //         data: {
        //             articleId: articleId,
        //             quantity: quantity
        //         }
        //     });
        // } else {
        //     res.status(400).json({ message: "Article not available" });
        // }
    }

    // const size = articleId.size;
    //const response = await fetch(`${urlStock}/stocks/${articleId}`);
    //console.log(response);

    //gerer cas ou l'article n'existe pas
    
    //gerer cas ou l'article n'a pas de taille
    //gerer cas ou l'article n'a pas de stock

    // const stock = await response.json();

    // parcourir stock pour trouver la taille qui correspond et recuperer l'objet correspondant

    //une fois l'objet trouvé, on vérifie si la quantité est suffisante


    // if (stock.quantity >= quantity) {
    //     const order = await client.order.create({
    //         data: {
    //             articleId: articleId,
    //             quantity: quantity
    //         }
    //     });
    //     res.status(201).json(order);
    // } else {
    //     res.status(400).json({ message: "Article not available" });
    // }
});

module.exports = router;