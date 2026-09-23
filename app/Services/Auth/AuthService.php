<?php

namespace App\Services\Auth;

use App\Concerns\ApiResponse;
use App\Mail\ForgetPassword;
use App\Mail\VerifyRegister;
use App\Mail\WelcomeMail;
use App\Models\User;
use App\Repositories\Auth\AuthRepository;
use Ichtrojan\Otp\Otp;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    use ApiResponse;

    public function __construct(
        protected AuthRepository $repository
    ) {}

    public function register(array $data)
    {
        $data['password'] = Hash::make($data['password']);

        $exists = $this->repository->TempUserByEmail($data['email']);

        $userexists = $this->repository->findByEmail($data['email']);

        if ($userexists) {
            throw new \Exception('You are already registered, please login');
        }

        if ($exists) {

            $otp = (new Otp)->generate($data['email'], 'numeric', 6, 15);

            Mail::to($data['email'])->send(new VerifyRegister($exists, $otp->token));

            return [
                'token' => $otp->token,
                'user'  => $exists->fresh(),
            ];
        }

        $tempUser = $this->repository->createTempUser($data);


        $otp = (new Otp)->generate($data['email'], 'numeric', 6, 15);

        Mail::to($data['email'])->send(new VerifyRegister($tempUser, $otp->token));


        // $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $otp->token,
            'user' => $tempUser->fresh(),
        ];
    }

    public function verifyEmail(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $tempUser = $this->repository->TempUserByEmail($data['email']);

            if (!$tempUser) {
                throw new \Exception('User not found');
            }

            $user = User::create([
                'first_name' => $tempUser->first_name,
                'last_name' => $tempUser->last_name,
                'email' => $tempUser->email,
                'password' => $tempUser->password,
                'email_verified_at' => now(),
            ]);

            $this->repository->DeleteTempUser($tempUser->email);

            $token = $user->createToken('api-token')->plainTextToken;

            Mail::to($user->email)->send(new WelcomeMail($user->first_name));

            return [
                'token' => $token,
                'user'  => $user,
            ];
        });
    }

    public function registerResendOtp(string $email): string
    {
        $tempUser = $this->repository->TempUserByEmail($email);

        if (!$tempUser) {
            throw new \Exception('User not found');
        }

        $otp = (new Otp)->generate($email, 'numeric', 6, 15);
        Mail::to($email)->send(new VerifyRegister($tempUser, $otp->token));

        return $otp->token;
    }

    public function login(array $credentials)
    {
        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.']
            ]);
        }

        $auth = Auth::user();

        $user = User::find($auth->id);

        $token = $user->createToken('api-token')->plainTextToken;

        return [
            'token' => $token,
            'user' => $user,
        ];
    }

    public function forgotPassword(string $email): string
    {

        $user = $this->repository->findByEmail($email);

        if (!$user) {
            throw new \Exception('User not found');
        }
        $otp = (new Otp)->generate($email, 'numeric', 6, 15);
        Mail::to($email)->send(new ForgetPassword($user, $otp->token));

        return $otp->token;
    }


    public function verifyForgetPass(array $data): array
    {
        $user = $this->repository->findByEmail($data['email']);

        if (!$user) {
            throw new \Exception('User not found');
        }

        // Generate password reset token
        $resetToken = Password::createToken($user);


        if ($user) {
            $user->update([
                'remember_token' => $resetToken,
            ]);
        }

        return [
            'reset_token' => $resetToken,
            'user'  => $user->fresh(),
        ];
    }

    public function forgotPasswordResendOtp(string $email): string
    {
        $user = $this->repository->findByEmail($email);

        if (!$user) {
            throw new \Exception('User not found');
        }

        $otp = (new Otp)->generate($email, 'numeric', 6, 15);
        Mail::to($email)->send(new ForgetPassword($user, $otp->token));

        return $otp->token;
    }

    public function resetPassword(array $data): string
    {
        return Password::reset(
            $data,
            function ($user, $password) {
                $user->password = Hash::make($password);
                $user->save();
            }
        );
    }
}
