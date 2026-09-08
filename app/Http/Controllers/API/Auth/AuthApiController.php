<?php

namespace App\Http\Controllers\API\Auth;

use App\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\OtpVerify;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\User;
use App\Services\Auth\AuthService;
use Exception;
use Ichtrojan\Otp\Otp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthApiController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthService $service
    ) {}

    public function register(RegisterRequest $request)
    {

        $result = $this->service->register(
            $request->validated()
        );

        return $this->successResponse(
            'Otp Send to Email',
            $result,
            201
        );
    }

    public function verifyRegister(OtpVerify $request)
    {
        $validate = (new Otp)->validate(
            $request->email,
            $request->otp
        );

        if (!$validate->status) {
            return $this->errorResponse(
                $validate->message,
                422
            );
        }

        $verify = $this->service->verifyEmail(
            $request->validated()
        );

        return $this->successResponse(
            'Email verified successfully',
            $verify,
            200
        );
    }

    public function registerResendOtp(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ])->validated();

        $result = $this->service->registerResendOtp(
            $validated['email']
        );

        return $this->successResponse(
            'OTP resent to email',
            $result,
            200
        );
    }

    public function login(LoginRequest $request)
    {
        $result = $this->service->login(
            $request->validated()
        );

        return $this->successResponse(
            'Login successful',
            $result,
        );
    }

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $data = $this->service->forgotPassword(
            $request->email
        );

        return $this->successResponse(
            'Otp sent to your email',
            $data,
        );
    }


    public function verifyForgetPass(OtpVerify $request)
    {
        $validate = (new Otp)->validate(
            $request->email,
            $request->otp
        );

        if (!$validate->status) {
            return $this->errorResponse(
                $validate->message,
                422
            );
        }

        $verify = $this->service->verifyForgetPass(
            $request->validated()
        );

        return $this->successResponse(
            'Email verified successfully',
            $verify,
            200
        );
    }

    public function forgotPasswordResendOtp(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ])->validated();

        $result = $this->service->forgotPasswordResendOtp(
            $validated['email']
        );

        return $this->successResponse(
            'OTP resent to email',
            $result,
            200
        );
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return $this->errorResponse('User not found', 404);
        }

        if ($user->remember_token != $request->reset_token) {
            return $this->errorResponse('Token is not match', 401);
        }

        if (!$user->remember_token) {
            return $this->errorResponse('Invalid or expired reset token', 422);
        }

        $user->update([
            'remember_token' => null,
            'password' => bcrypt($request->password),
        ]);

        Password::deleteToken($user);

        return $this->successResponse(
            'Password reset successfully',
            null,
            200
        );
    }

    // logout
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->successResponse(
            'Logged out successfully',
            null,
            200
        );
    }

    public function socialLogin(Request $request)
    {
        $request->validate([
            'provider' => 'required|in:google',
            'token' => 'required',
        ]);

        try {
            if ($request->provider === 'google') {
                $socialUser = Socialite::driver('google')->stateless()->userFromToken($request->token);
            }else {
                return $this->error('Unsupported provider', 422);
            }

            if ($socialUser) {
                $user = User::where('email', $socialUser->email)->first();
                if (!$user) {
                    $password = Str::random(16);

                    $user = User::create([
                        'first_name'        => $socialUser->getName() ?? "First",
                        'last_name'         => $socialUser->getLastName() ?? "Last",
                        'email'             => $socialUser->email,
                        'password'          => Hash::make($password),
                        'avatar'            => $socialUser->getAvatar() ?? null,
                        'email_verified_at' => now(),
                        'provider'          => $request->provider,
                        'provider_id'       => $socialUser->getId() ?? null,
                        'role'              => 'user',
                    ]);
                }
                Auth::login($user);
                $token = $user->createToken('AuthToken')->plainTextToken;

                return response()->json([
                    'status' => 200,
                    'message' => 'Login Successful',
                    'token_type' => 'Bearer',
                    'token' => $token,
                    'data' => $user
                ]);

            } else {

                return $this->error('Invalid or Expired Token', 401);
            }
        } catch (Exception $e) {
            \Log::error('Social login failed: ' . $e->getMessage());
            return $this->error('Something went wrong', 500);
        }
    }
}
