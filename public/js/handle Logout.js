/* eslint-disable*/

const logout = async () => {
    try {
        const res = await axios({
        method: 'GET',
        url: '/api/v1/users/logout',
        });
        if (res.data.status === 'success') location.reload();
    } catch (err) {
        showAlert('error', 'Error logging out! Try again.');
    }
};

const lgBtn = document.querySelector('.nav__el--logout');
if(lgBtn)
{
    lgBtn.addEventListener('click',logout);
}
