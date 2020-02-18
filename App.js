import React from 'react'
import {
  StyleSheet,
  View,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native'

import RNPickerSelect from 'react-native-picker-select'

const currency = [
  {label: 'USD', value: 'USD'},
  {label: 'RUB', value: 'RUB'},
  {label: 'EUR', value: 'EUR'},
]

function randomString(i) {
  let rnd = ''
  while (rnd.length < i) 
      rnd += Math.random().toString(36).substring(2)
  return rnd.substring(0, i)
}

function randomNumber(min, max, float = false) {
  return float ? Number(('' + Math.floor(min + Math.random() * (max + 1 - min))).substring(0, 5)) : Math.floor(min + Math.random() * (max + 1 - min))
}

function createProducts() {
  let products = []

  for (let i = 0; i < 10; i++) {
    let product = {
      id: i,
      img: 'https://cdn0.iconfinder.com/data/icons/business-mix/512/cargo-512.png',
      name: randomString(10),
      price: randomNumber(100, 10000, true),
      quantity: randomNumber(1, 100),
      currency: currency[randomNumber(0, 2)]
    }

    products.push(product)
  }

  return products
}

function Product({product, changeCurrencyForProduct}) {
  return (
    <View style={styles.Product}>
      <Image   
        source={{uri: product.img}}
        style={styles.Img}
        fadeDuration={0}
      />
      <View style={{flex: 1, flexDirection: 'column'}}>
        <Text>Имя: {product.name}</Text>
        <Text style={{color: '#999'}}>Кол-во: {product.quantity}</Text>
        <Text style={{color: '#999'}}>Цена: {product.price}</Text>
      </View>
      <View style={{flex: 1, flexDirection: 'column'}}>
        
        <View>
          <RNPickerSelect
            onValueChange={(currency) => changeCurrencyForProduct(product.id, currency)}
            items={currency}
            value={product.currency.value}
          />
        </View>
        
      </View>
    </View>
  )
}

class App extends React.Component {
  state = {
    products: [],
    isFetching: false,
    result: {
      EUR: 0,
      RUB: 0,
      USD: 0
    }
  }

  changeCurrencyForProduct(id, currency) {
    let products = this.state.products

    products.find(x => x.id == id).currency = {value: currency, label: currency}
    
    this.setState({products})
  }

  componentDidMount() {
    this.setState({products: createProducts()})
  }

  getResult() {
    this.setState({isFetching: true})

    fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      method: "GET",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then((response) => response.json())
    .then((data) => {
      let products = this.state.products 

      let currency = {
        EUR: data.Valute.EUR.Value,
        RUB: 1,
        USD: data.Valute.USD.Value
      }

      let result = {
        EUR: 0,
        RUB: 0,
        USD: 0
      }

      for (let i = 0; i < products.length; i++) {
        switch (products[i].currency.value) {
          case 'USD':
            result.USD += products[i].price * products[i].quantity
            result.RUB += (products[i].price * products[i].quantity) * currency.USD
            result.EUR += ((products[i].price * products[i].quantity) / currency.USD) * currency.EUR
          case 'RUB':
            result.USD += (products[i].price * products[i].quantity) / currency.USD
            result.RUB += products[i].price * products[i].quantity
            result.EUR += (products[i].price * products[i].quantity) / currency.EUR
          case 'EUR':
            result.USD += ((products[i].price * products[i].quantity) / currency.EUR) * currency.USD
            result.RUB += (products[i].price * products[i].quantity) * currency.EUR
            result.EUR += products[i].price * products[i].quantity
          default:
            break;
        }
      }

      this.setState({isFetching: false, result})
    })
  }

  render() {
    if(this.state.isFetching)
      return (
        <View style={styles.Layout}>
          <ActivityIndicator size="large" color="#008FF7" />
        </View>
      )

    return (
      <View style={styles.Layout}>
        <View style={styles.ProductsLayout}>
          <FlatList
            refreshControl={
              <RefreshControl
                  colors={["#008FF7", "#008FF7"]}
                  refreshing={false}
                  onRefresh={() => this.setState({products: createProducts()})}
              />
            }
            data={this.state.products}
            ItemSeparatorComponent={() => (<View style={styles.Seperator}/>)}
            renderItem={({item}) => (
              <Product
                product={item}
                changeCurrencyForProduct={(id, currency) => this.changeCurrencyForProduct(id, currency)}
              />
            )}
            keyExtractor={item => item.id}
          />
        </View>

        <View style={styles.ResultLayout}>
          <TouchableOpacity style={styles.Btn} onPress={() => this.getResult()}>
            <Text style={styles.BtnText}>Посчитать</Text>
          </TouchableOpacity>

          <Text style={{fontSize: 20}}>Общая стоимость</Text>

          <Text selectable={true}>
            USD - {this.state.result.USD} ${"\n"}
            RUB - {this.state.result.RUB} ₽{"\n"}
            EUR - {this.state.result.EUR} €
          </Text>
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  Layout: {
    flex: 1,
    justifyContent: 'center'
  },
  ProductsLayout: {
    flex: 3
  },
  ResultLayout: {
    flex: 1,
    flexDirection: 'column'
  },
  Seperator: {
    height: 1,
    width: '100%',
    backgroundColor: '#008FF7'
  },
  Product: {
    flexDirection: 'row',
    height: 70,
    alignItems: 'center'
  },
  Img: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginHorizontal: 5
  },
  Btn: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: '#008FF7'
  },
  BtnText: {
    color: '#fff'
  }
})

export default App
