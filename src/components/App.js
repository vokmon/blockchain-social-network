import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import './App.css';
import SocialNetwork from '../abis/SocialNetwork.json';
import Navbar from './Navbar';
import Main from './Main';

const App = () => {
  const [state, setState] = useState({
    account: '',
    socialNetwork: null,
    postCount: 0,
    posts: [],
  });

  const [loading, setLoading] = useState(true);

  const initWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'Non-Ethereum browser detected. You should consider trying MetaMask!'
      );
    }
  };

  const loadPosts = async (socialNetwork) => {
    const postCount = await socialNetwork.methods.postCount().call();
      console.log(postCount);

      // Load posts
      const postPromises = [];
      for (let i = 1; i <= postCount; i++) {
        postPromises.push(socialNetwork.methods.posts(i).call());
      }

      const posts = await Promise.all(postPromises);
      console.log(posts);

      return {
        postCount,
        posts,
      }
  }
  const loadBlockchainData = async () => {
    const web3 = window.web3;

    //Load accounts
    const accounts = await web3.eth.getAccounts();
    console.log(accounts);

    const networkId = await web3.eth.net.getId();
    console.log(networkId);
    const network = SocialNetwork.networks[networkId];
    if (SocialNetwork.networks[networkId]) {
      console.log(network);
      const socialNetwork = new web3.eth.Contract(
        SocialNetwork.abi,
        network.address
      );

      const {
        postCount,
        posts,
      } = await loadPosts(socialNetwork);

      setState((previousState) => ({
        ...previousState,
        account: accounts[0],
        socialNetwork,
        postCount,
        posts: [...previousState.posts, ...posts],
      }));
    } else {
      alert('SocialNetwork contract not deployed to the detected network.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await initWeb3();
      await loadBlockchainData();
      setLoading(false);
    };
    init();
  }, []);

  const createPost = async (content) => {
    setLoading(true);
    const receipt = await state.socialNetwork.methods.createPost(content).send({
      from: state.account,
    });
    console.log(receipt)
    setLoading(false);
    const {
      postCount,
      posts,
    } = await loadPosts(state.socialNetwork);

    setState((previousState) => ({
      ...previousState,
      postCount,
      posts: [...posts],
    }));
  }

  const tipPost = async (id, tipAmount) => {
    setLoading(true);
    const receipt = await state.socialNetwork.methods.tipPost(id).send({
      from: state.account,
      value: tipAmount,
    });
    const {
      postCount,
      posts,
    } = await loadPosts(state.socialNetwork);

    setState((previousState) => ({
      ...previousState,
      postCount,
      posts: [...posts],
    }));
    setLoading(false);
  }
  return (
    <div>
      <Navbar account={state.account} />
      {loading ? (
        <div id='loader' className='text-center mt-5'>Loading...</div>
      ) : (
        <Main posts={state.posts} createPost={createPost} tipPost={tipPost} />
      )}
      
    </div>
  );
};

export default App;
