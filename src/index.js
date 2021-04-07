import './scss/main.scss';
import $ from 'jquery';
import { t, changeLang, onChangeLang } from './localization';
import { refreshLang, generateHtml } from './localization';
import SubscriptionsTable from './subscriptions-table'
import 'jquery-validation';
import 'jquery-modal';
import 'jquery.cookie';
import cookie from './cookie';

onChangeLang((langCode) => {
    $('#username')[0].placeholder = t('placeholderName');
    $('#surname')[0].placeholder = t('placeholderLastName');
    $('#question')[0].placeholder = t('placeholderQuestion');

    $('#username_pay')[0].placeholder = t('placeholderName');
    $('#surname_pay')[0].placeholder = t('placeholderLastName');
    $('#question_pay')[0].placeholder = t('placeholderPayNote');
    $('#password_login')[0].placeholder = t('password');
})

$.validator.methods.email = function(value, element) {
    return this.optional(element) || /[a-z]+@[a-z]+\.[a-z]+/.test(value);
}

$(window).on('load', () => {
    $('#preloader').fadeOut('slow');
})

$(document).ajaxError(function (e, jqXHR, ajaxSettings, thrownError) {
    if (Math.trunc(jqXHR.status/100) === 5 || jqXHR.status === 0) {
        location.replace('./500.html');
    } 
    // else {
    //     alert(`${t('messageError')}\n ${thrownError}`);
    // }
});

$('#login').on('click', function () {
    $('.login-modal').toggle();
});

$('.login-modal').on('mousedown', function (e) {
    if ($(e.target).is('.login-modal')) {
        $('.login-modal').hide();
    }
});

const getLoginSchema = () => {
    return {
        errorClass: "input_error",
        rules: {
            email: {
                required: true,
                email: true,
            },
            password: {
                minlength: 6,
                required: true,
            },
        },
        messages: {
            email: {
                required: t('emailRequired'),
                email: t('emailCorrect'),
            },
            password: {
                minlength: t('minSymbols'),
                required: t('passwordRequired'),
            }
        }
    }
};

$('#loginform').on('submit', function(event){
    event.preventDefault();
    let loginForm = $(this);
    loginForm.validate(getLoginSchema());
    if (!loginForm.valid()) {
        return
    }
    $('#error_login').html('');

    $.ajax({
        url: process.env.DO_BACKEND_HOST + '/api/rest-auth/login/',
        type: 'POST',
        data: {
            email: this.email_login.value,
            password: this.password_login.value,
        },
        headers: {
            ['Accept-Language']: localStorage.getItem('lang'),
        },
        success: function(data, status, xhr) {
            if (xhr.status !== 200) {
                return
            }
            cookie.set('token', data.key);
            cookie.set('firstname', data.user.first_name);
            cookie.set('lastname', data.user.last_name);
            cookie.set('email', data.user.email);
            document.location = process.env.DO_FRONTEND_HOST + '/system/home/';
        },
        error: function (jqXHR, textStatus, errorMessage) {
            const key = Object.keys(jqXHR.responseJSON)[0];
            const keyMessage = Object.values(jqXHR.responseJSON)[0][0];
            key === 'non_field_errors' ? $('#error_login').html(keyMessage) : $('#error_login').html(`${key}: ${keyMessage}`);
        }
    })
})

$('#forgot_password').on('click', function () {
    document.location = process.env.DO_FRONTEND_HOST + '/auth/restore-pass/?lang=' + localStorage.getItem('lang');
});

$(() => {
    const firstName = cookie.get('firstname');
    const lastName = cookie.get('lastname');
    if ( !firstName && !lastName ) {
        return
    } else {
        $('#login').replaceWith(/*html*/`
        <span class="user_profile">
            <ion-icon class="profile_icon" name="person-circle-outline"></ion-icon>
            <a class="link link_start">
                ${firstName} ${lastName[0]}.
            </a>
            <ion-icon class="arrow_icon" name="chevron-down-outline"></ion-icon>
        </span>
        <ul class="submenu">
            <li id="user-profile" class="submenu_item">
                <a class="link link_start">
                    ${generateHtml('Мій кабінет', 'My profile')}
                </a>
            </li>
            <li id="logout" class="submenu_item">
                <a class="link link_start ">
                    ${generateHtml('Вийти', 'Log out')}
                </a>
            </li>
        </ul>
        `);
        refreshLang();
        $('#signup').hide();
    }

    $('#user-profile').on('click', function () {
        document.location = process.env.DO_FRONTEND_HOST + '/system/profile/projects/';
    });

    $('#logout').on('click', function() {
        cookie.remove('token');
        cookie.remove('firstname');
        cookie.remove('lastname');
        cookie.remove('email');
        document.location.reload();
    })
});

$('#change-lang').on('click', function(event) {
    event.preventDefault();
    let langUser = 'uk';
    if (localStorage.getItem('lang') === 'uk') {
        langUser = 'en';
    }
    changeLang(langUser);
});

const getSchema = () => {
    return {
        errorClass: "input_error",
        rules: {
            username: {
                required: true,
                minlength: 2,
            },
            surname: {
                required: true,
                minlength: 2,
            },
            email: {
                required: true,
                email: true,
            },
            phone: {
                minlength: 2,
                maxlength: 15,
            },
            question: {
                required: true,
            },
        },
        messages: {
            username: {
                required: t('usernameRequired'),
                minlength: t('minSymbols'),
            },
            surname: {
                required: t('surnameRequired'),
                minlength: t('minSymbols'),
            },
            email: {
                required: t('emailRequired'),
                email: t('emailCorrect'),
            },
            phone: {
                minlength: t('minSymbols'),
                maxlength: t('maxSymbols'),
            },
            question: {
                required: t('questionAsk'),
            }
        }
    }
};

$('#contact-form').on('submit', function(event){
    event.preventDefault();
    let form = $(this);
    form.validate(getSchema())
    if (!form.valid()) {
        return
    }

    let data = {
        name: `${this.username.value} ${this.surname.value}`,
        email: this.email.value,
        subject: `${this.username.value} ${this.surname.value}`,
        message: this.question.value,
    }

    $.ajax({
        url: `${process.env.DO_BACKEND_HOST}/api/landing_mail/`,
        type: "POST",
        dataType: "json",
        data: data,
        success: function(data, status, xhr) {
            if (xhr.status !== 200) {
                return
            }
            alert(t('messageSuccess'));
            form[0].reset();
        }
    })
});

$('.link-platform').on('click', function () {
    window.open(`${process.env.DO_FRONTEND_HOST}/system/home/?lang=${localStorage.getItem('lang')}`);
});

$('.link-landing').on('click', function () {
    window.open(`${process.env.DO_MAIN_LANDING}?lang=${localStorage.getItem('lang')}`);
});

$('.link-cpk').on('click', function () {
    window.open(`https://pep.org.ua/${localStorage.getItem('lang')}`);
});

$('#api-docs').on('click', function () {
    window.open(`${process.env.DO_BACKEND_HOST}/schema/redoc/`);
});

$('.terms_and_conditions').on('click', function () {
    if (localStorage.getItem('lang') === 'uk') {
       location.assign(`${process.env.DO_FRONTEND_HOST}/docs/TermsAndConditionsUk.html`);
    } else {
        location.assign(`${process.env.DO_FRONTEND_HOST}/docs/TermsAndConditionsEn.html`);
    }
});

$('.privacy_policy').on('click', function () {
    if (localStorage.getItem('lang') === 'uk') {
        location.assign(`${process.env.DO_FRONTEND_HOST}/docs/PrivacyPolicyUk.html`);
    } else {
        location.assign(`${process.env.DO_FRONTEND_HOST}/docs/PrivacyPolicyEn.html`);
    }
});

// $('.menu-btn').on('click', function (event) {
//     event.preventDefault();
//     $('.menu-btn').toggleClass('open-menu');
//     $('.menu-navigation').fadeToggle();

//     $('.navigation__item').on('click', function (event) {
//         $('.menu-btn').removeClass('open-menu');
//         $('.menu-navigation').fadeOut();
//     })
// });

$.ajax({
    url: `${process.env.DO_BACKEND_HOST}/api/stats/count-peps/`,
    success: function(data) {
        $('#peps').html(data.peps_count.toLocaleString('en'));
    },
});

$.ajax({
    url: `${process.env.DO_BACKEND_HOST}/api/stats/count-pep-related-persons/`,
    success: function(data) {
        $('#pep-rp').html(data.pep_related_persons_count.toLocaleString('en'));
    },
});

$.ajax({
    url: `${process.env.DO_BACKEND_HOST}/api/stats/count-pep-related-companies/`,
    success: function(data) {
        $('#pep-rc').html(data.pep_related_companies_count.toLocaleString('en'));
    },
});

$.ajax({
    url: `${process.env.DO_BACKEND_HOST}/api/stats/count-pep-relation-categories/`,
    success: function(data) {
        $('#pep-categories').html(
            (data.business_pep_relations_count + data.personal_pep_relations_count + data.family_pep_relations_count)
            .toLocaleString('en'));
    },
});

const getPaySchema = () => {
    return {
        errorClass: "input_error_pay",
        rules: {
            username_pay: {
                required: true,
                minlength: 2,
            },
            surname_pay: {
                required: true,
                minlength: 2,
            },
            phone: {
                minlength: 2,
                maxlength: 15,
            },
            email_pay: {
                required: true,
                email: true,
            }
        },
        messages: {
            username_pay: {
                required: t('usernameRequired'),
                minlength: t('minSymbols'),
            },
            surname_pay: {
                required: t('surnameRequired'),
                minlength: t('minSymbols'),
            },
            phone_pay: {
                minlength: t('minSymbols'),
                maxlength: t('maxSymbols'),
            },
            email_pay: {
                required: t('emailRequired'),
                email: t('emailCorrect'),
            }
        }
    }
};

$('#pay-form').on('submit', function(event){
    event.preventDefault();
    let payForm = $(this);
    payForm.validate(getPaySchema())

    if (!payForm.valid()) {
        return
    }

    let payData = {
        first_name: this.username_pay.value,
        last_name: this.surname_pay.value,
        email: this.email_pay.value,
        phone: this.phone_pay.value,
        note: this.question_pay.value,
    }

    $('.open-payform').fadeOut();

    $.ajax({
        url: `${process.env.DO_BACKEND_HOST}/api/payment/custom-subscription-request/create/`,
        type: "POST",
        dataType: "json",
        data: payData,
        success: function(data, status, xhr) {
            if (xhr.status === 201) {
                alert(t('messageSuccess'));
            }
            payForm[0].reset();
        },
    })
});

$('#payform-close').on('click', function () {
    $('.open-payform').fadeOut();
});

new SubscriptionsTable('#subs-table').init();
