
import React, {useState, useEffect} from "react";
import { SafeAreaView, View, Text, TextInput, Button, FlatList, TouchableOpacity, Modal, Alert, StyleSheet } from "react-native";
import * as DocumentPicker from 'expo-document-picker';
import Papa from 'papaparse';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'site_listings_v1';
const CART_KEY = 'site_cart_v1';
const WALLET_KEY = 'wallet_balance_v1';

export default function App(){
  const [sites, setSites] = useState([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState({minDa:'', maxPrice:'', minTraffic:''});
  const [selected, setSelected] = useState(null);
  const [cart, setCart] = useState([]);
  const [wallet, setWallet] = useState(0);

  useEffect(()=>{ loadAll(); },[]);

  async function loadAll(){
    try{
      const s = await AsyncStorage.getItem(STORAGE_KEY);
      const c = await AsyncStorage.getItem(CART_KEY);
      const w = await AsyncStorage.getItem(WALLET_KEY);
      if(s) setSites(JSON.parse(s));
      if(c) setCart(JSON.parse(c));
      if(w) setWallet(parseFloat(w) || 0);
    }catch(e){ console.log(e); }
  }

  async function pickCSV(){
    const res = await DocumentPicker.getDocumentAsync({type:'text/*'});
    if(res.type === 'success'){
      const body = await fetch(res.uri).then(r=>r.text());
      Papa.parse(body, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          // expect rows: URL,Price,Traffic,DA,Email
          const rows = results.data.map(r=>{
            return {
              url: r[0]?.trim(),
              price: parseFloat(r[1]||0),
              traffic: parseFloat(r[2]||0),
              da: parseFloat(r[3]||0),
              email: r[4]?.trim()||''
            }
          }).filter(x=>x.url);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
          setSites(rows);
          Alert.alert('CSV loaded', `${rows.length} sites imported.`);
        }
      });
    }
  }

  function searchAndFilter(){
    return sites.filter(s=>{
      if(query && !s.url.includes(query)) return false;
      if(filter.minDa && s.da < parseFloat(filter.minDa)) return false;
      if(filter.maxPrice && s.price > parseFloat(filter.maxPrice)) return false;
      if(filter.minTraffic && s.traffic < parseFloat(filter.minTraffic)) return false;
      return true;
    });
  }

  async function addToCart(site){
    const exists = cart.find(c=>c.url===site.url);
    if(exists){ Alert.alert('Already in cart'); return; }
    const nc = [...cart, site];
    setCart(nc);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(nc));
    Alert.alert('Added to cart', site.url);
  }

  async function buyCart(){
    const total = cart.reduce((a,b)=>a + (b.price||0),0);
    if(total > wallet){ Alert.alert('Insufficient funds', `Total ${total} > Wallet ${wallet}`); return; }
    const newWallet = wallet - total;
    setWallet(newWallet);
    await AsyncStorage.setItem(WALLET_KEY, String(newWallet));
    setCart([]);
    await AsyncStorage.removeItem(CART_KEY);
    Alert.alert('Purchase complete', `Spent ${total}. New balance: ${newWallet}`);
  }

  async function topUp(amount){
    const newWallet = wallet + parseFloat(amount);
    setWallet(newWallet);
    await AsyncStorage.setItem(WALLET_KEY, String(newWallet));
  }

  return (
    <SafeAreaView style={{flex:1, padding:12}}>
      <Text style={{fontSize:20, fontWeight:'700'}}>Site Marketplace (mobile demo)</Text>
      <View style={{marginTop:8}}>
        <Button title="Import CSV (URL,Price,Traffic,DA,Email)" onPress={pickCSV} />
      </View>

      <View style={{marginTop:12}}>
        <TextInput placeholder="Search by URL substring" value={query} onChangeText={setQuery} style={styles.input}/>
        <View style={{flexDirection:'row', gap:8}}>
          <TextInput placeholder="min DA" value={filter.minDa} onChangeText={v=>setFilter({...filter,minDa:v})} style={[styles.input,{flex:1}]}/>
          <TextInput placeholder="max Price" value={filter.maxPrice} onChangeText={v=>setFilter({...filter,maxPrice:v})} style={[styles.input,{flex:1}]}/>
          <TextInput placeholder="min Traffic" value={filter.minTraffic} onChangeText={v=>setFilter({...filter,minTraffic:v})} style={[styles.input,{flex:1}]}/>
        </View>
      </View>

      <View style={{marginTop:12, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
        <Text>Wallet: {wallet.toFixed(2)}</Text>
        <Button title="Top up 50" onPress={()=>topUp(50)} />
        <Button title="View Cart" onPress={()=> setSelected({view:'cart'})} />
      </View>

      <FlatList
        data={searchAndFilter()}
        keyExtractor={(i)=>i.url}
        style={{marginTop:12}}
        renderItem={({item})=>(
          <TouchableOpacity onPress={()=>setSelected({view:'detail', item})} style={styles.card}>
            <Text style={{fontWeight:'700'}}>{item.url}</Text>
            <Text>DA: {item.da}  Traffic: {item.traffic}</Text>
            <Text>Price: ${item.price}  Email: {item.email}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal visible={!!selected} animationType="slide">
        <SafeAreaView style={{flex:1, padding:12}}>
          {selected?.view === 'detail' && selected.item && (
            <>
              <Text style={{fontSize:18, fontWeight:'700'}}>{selected.item.url}</Text>
              <Text>Price: ${selected.item.price}</Text>
              <Text>Traffic: {selected.item.traffic}</Text>
              <Text>DA: {selected.item.da}</Text>
              <Text>Email: {selected.item.email}</Text>
              <View style={{marginTop:12}}>
                <Button title="Add to cart" onPress={()=>addToCart(selected.item)} />
              </View>
            </>
          )}

          {selected?.view === 'cart' && (
            <>
              <Text style={{fontSize:18, fontWeight:'700'}}>Cart ({cart.length})</Text>
              <FlatList data={cart} keyExtractor={i=>i.url} renderItem={({item})=>(
                <View style={{padding:8, borderBottomWidth:1}}>
                  <Text>{item.url} - ${item.price}</Text>
                </View>
              )} />
              <Text>Total: ${cart.reduce((a,b)=>a + (b.price||0),0)}</Text>
              <Button title="Buy with wallet" onPress={buyCart} />
            </>
          )}

          <View style={{marginTop:12}}>
            <Button title="Close" onPress={()=>setSelected(null)} />
          </View>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  input:{borderWidth:1, padding:8, borderRadius:6, marginTop:6},
  card:{padding:10, borderWidth:1, borderRadius:8, marginBottom:8}
});
