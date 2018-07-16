
import 'slick-carousel/slick/slick';

class Shelf {

	constructor(urlProducts) {
		this.urlProducts = urlProducts;
	}

	/**
	 *Retorna o template de prateleira
	 *
	 * @param {Object} data
	 * @returns String
	 * @memberof Shelf
	 */
	getTemplate(data) {
		return `<div class="shelf-item" data-id="${data.businessId}">
			<div class="box">
				<figure>
					<img src="img/${data.imageName.split('/').pop()}" alt="${data.name}" title="${data.name}">
				</figure>
				<h3 class="name">${data.name}</h3>
				<div class="price">
					<p class="bestPrice">Por: <strong>${data.price}</strong></p>
					<p class="installments">${data.productInfo.paymentConditions.replace('ou', 'ou <strong>').replace('sem', '</strong>sem')}</p>
				</div>
				<button class="buyButton">adicionar ao carrinho <i class="icon baseline-add_shopping_cart"></i></button>
			</div>
		</div>`;
	}

	/**
	 *Retorna ajax de lista de produtos
	 *
	 * @returns Promise
	 * @memberof Shelf
	 */
	getProducts() {
		return $.get(this.urlProducts).then((res) => {
			return res && res[0] && res[0].data;
		});
	}

	/**
	 *Renderiza prateleiras
	 *
	 * @memberof Shelf
	 */
	render() {
		this.getProducts().done((res) => {

			const $history = $('<div class="history"><h2>Você visitou:</h2><div class="shelf"></div></div>'),
				$recommentadion = $('<div class="recommendations"><h2>e talvez se interesse por:</h2><div class="shelf"></div></div>');

			$history.find('.shelf').append(this.getTemplate(res.item));

			for (const product of res.recommendation) {
				$recommentadion.find('.shelf').append(this.getTemplate(product));
			}

			$('.content').append($history).append($recommentadion);

			$recommentadion.find('.shelf').slick({
				infinite: true,
				slidesToShow: 3,
				slidesToScroll: 1,
				arrows: false,
				dots: true,
				responsive: [
					{
						breakpoint: 1080,
						settings: {
							slidesToShow: 2,
						},

					},
					{
						breakpoint: 900,
						settings: {
							slidesToShow: 1,
						}
					},
				]
			});
		});
	}

}

$(document).ready(() => {

	const shelf = new Shelf('./products.json');

	shelf.render();
});
